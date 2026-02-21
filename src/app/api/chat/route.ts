import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatMessageSchema } from "@/lib/validators";
import { getBuilderChatResponse } from "@/lib/ai";
import { REWARD_AMOUNTS, generateIdempotencyKey } from "@/lib/rewards";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const parsed = chatMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { projectId, message, tag } = parsed.data;

    // Verify ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, name, description, url, why_built, progress_score")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Project not found" } },
        { status: 404 }
      );
    }

    // Load recent messages for context
    const { data: recentMessages } = await supabase
      .from("messages")
      .select("role, content, tag")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(10);

    const chatHistory = (recentMessages ?? [])
      .reverse()
      .map((m: { role: string; content: string }) => ({
        role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
        content: m.content,
      }));

    // Insert user message
    const { data: userMsg } = await supabase
      .from("messages")
      .insert({
        project_id: projectId,
        role: "user",
        content: message,
        tag: tag ?? "general",
        pineapples_earned: 0,
      })
      .select()
      .single();

    // Build project context string for AI
    const projectContext = [
      `Project: ${project.name}`,
      project.description ? `Description: ${project.description}` : null,
      project.url ? `URL: ${project.url}` : null,
      `Progress: ${project.progress_score}%`,
    ]
      .filter(Boolean)
      .join("\n");

    // Get AI response containing structured JSON
    const aiPayload = await getBuilderChatResponse(
      projectContext,
      message,
      chatHistory
    );

    let aiResponse = aiPayload.reply;
    const finalIntent = aiPayload.intent;
    const businessUpdate = aiPayload.business_update;

    // POST-PROCESSING: Forcefully strip Markdown and Emojis
    // 1. Remove Markdown (*, **, _, ~, `, >)
    aiResponse = aiResponse.replace(/(\*\*|__|\*|_|~~|`|>|#)/g, "");
    
    // 2. Remove Markdown Links [text](url) -> text
    aiResponse = aiResponse.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    
    // 3. Remove Emojis (Unicode ranges)
    aiResponse = aiResponse.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "");

    // 4. Clean up double spaces created by removal
    aiResponse = aiResponse.replace(/\s+/g, " ").trim();

    // Update Progress Score if needed
    if (businessUpdate.progress_delta > 0) {
      const newScore = Math.min(100, project.progress_score + businessUpdate.progress_delta);
      if (newScore !== project.progress_score) {
        await supabase
          .from("projects")
          .update({ progress_score: newScore })
          .eq("id", projectId);
      }
    }

    // Check Rate Limit (60 prompts per project per hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentPrompts } = await supabase
      .from("reward_ledger")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("event_type", "chat_prompt")
      .gte("created_at", oneHourAgo);

    const isRateLimited = (recentPrompts ?? 0) >= 60;

    // Calculate pineapple rewards
    const rewardItems: Array<{ event_type: string; amount: number; idempotency_key: string }> = [];

    rewardItems.push({
      event_type: "chat_prompt",
      amount: isRateLimited ? 0 : (REWARD_AMOUNTS.chat_prompt || 1),
      idempotency_key: `${userMsg?.id}-prompt-reward`,
    });

    if (["feature", "customer", "revenue"].includes(finalIntent)) {
      rewardItems.push({
        event_type: `chat_${finalIntent}`, // chat_feature, chat_customer, chat_revenue
        amount: isRateLimited ? 0 : (REWARD_AMOUNTS[`chat_${finalIntent}`] || 1),
        idempotency_key: `${userMsg?.id}-${finalIntent}-bonus`,
      });
    }

    const eventTypeMap: Record<string, string> = {
      feature: "feature_shipped",
      customer: "customer_added",
      revenue: "revenue_logged",
    };

    if (businessUpdate.traction_signal && ["feature", "customer", "revenue"].includes(finalIntent)) {
      const tractionEventType = eventTypeMap[finalIntent];
      rewardItems.push({
        event_type: tractionEventType,
        amount: isRateLimited ? 0 : (REWARD_AMOUNTS[tractionEventType] || 3),
        idempotency_key: `${userMsg?.id}-${tractionEventType}`,
      });
    }

    const totalRewardAmount = rewardItems.reduce((acc, item) => acc + item.amount, 0);

    // Save the traction signal as the 'summary'
    const summary = businessUpdate.traction_signal || null;

    // Insert AI response message
    // ... rest of the code
    const { data: assistantMsg } = await supabase
      .from("messages")
      .insert({
        project_id: projectId,
        role: "assistant",
        content: aiResponse,
        summary: summary, // Persist the traction signal summary
        tag: finalIntent ?? "general",
        pineapples_earned: totalRewardAmount,
      })
      .select()
      .single();

    // Award pineapples (idempotent)
    let pineapplesEarned = 0;
    
    // Attempt inserting all non-zero rewards
    for (const item of rewardItems) {
      if (item.amount > 0) {
        const { error: rewardError } = await supabase
          .from("reward_ledger")
          .insert({
            user_id: user.id,
            project_id: projectId,
            event_type: item.event_type,
            amount: item.amount,
            idempotency_key: item.idempotency_key,
          });

        if (!rewardError) {
          pineapplesEarned += item.amount;
        }
      }
    }

    if (pineapplesEarned > 0) {
      // Update balance directly
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("pineapple_balance")
        .eq("id", user.id)
        .single();

      if (currentProfile) {
        await supabase
          .from("profiles")
          .update({
            pineapple_balance: currentProfile.pineapple_balance + pineapplesEarned,
          })
          .eq("id", user.id);
      }
    }

    // Log activity event for the chat prompt itself
    await supabase.from("activity_events").insert({
      project_id: projectId,
      user_id: user.id,
      event_type: "chat_prompt",
      metadata: { tag: finalIntent ?? "general", message_preview: message.substring(0, 100) },
    });

    // Log traction signal if present
    if (businessUpdate.traction_signal && ["feature", "customer", "revenue"].includes(finalIntent)) {
      await supabase.from("activity_events").insert({
        project_id: projectId,
        user_id: user.id,
        event_type: eventTypeMap[finalIntent],
        metadata: { description: businessUpdate.traction_signal },
      });
    }

    return NextResponse.json({
      assistantMessage: assistantMsg,
      pineapplesEarned,
      progressDelta: businessUpdate.progress_delta,
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

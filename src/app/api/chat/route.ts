import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatMessageSchema } from "@/lib/validators";
import { getChatResponse } from "@/lib/ai";
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

    // Get AI response
    const aiResponse = await getChatResponse(
      projectContext,
      message,
      chatHistory
    );

    // Calculate pineapple reward
    const rewardAmount = REWARD_AMOUNTS.chat_prompt ?? 5;
    const idempotencyKey = generateIdempotencyKey(
      user.id,
      projectId,
      "chat_prompt",
      userMsg?.id ?? Date.now().toString()
    );

    // Insert AI response message
    const { data: assistantMsg } = await supabase
      .from("messages")
      .insert({
        project_id: projectId,
        role: "assistant",
        content: aiResponse,
        tag: tag ?? "general",
        pineapples_earned: rewardAmount,
      })
      .select()
      .single();

    // Award pineapples (idempotent)
    let pineapplesEarned = 0;
    const { error: rewardError } = await supabase
      .from("reward_ledger")
      .insert({
        user_id: user.id,
        project_id: projectId,
        event_type: "chat_prompt",
        amount: rewardAmount,
        idempotency_key: idempotencyKey,
      });

    if (!rewardError) {
      pineapplesEarned = rewardAmount;
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
            pineapple_balance: currentProfile.pineapple_balance + rewardAmount,
          })
          .eq("id", user.id);
      }
    }

    // Log activity event
    await supabase.from("activity_events").insert({
      project_id: projectId,
      user_id: user.id,
      event_type: "chat_prompt",
      metadata: { tag: tag ?? "general", message_preview: message.substring(0, 100) },
    });

    return NextResponse.json({
      assistantMessage: assistantMsg,
      pineapplesEarned,
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

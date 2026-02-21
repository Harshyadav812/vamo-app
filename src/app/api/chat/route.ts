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

    // Auto-classify tag if not provided
    let finalTag = tag;
    if (!finalTag || finalTag === "general") {
      const classificationPrompt = `
        Classify the user's message into one of these tags: "feature", "bug", "improvement", "milestone", "general".
        - "milestone": Updates about revenue, user counts, launches, or major achievements.
        - "feature": Implementing new functionality.
        - "bug": Fixing issues.
        - "improvement": Enhancing existing features.
        - "general": General discussion.
        
        User Message: "${message}"
        
        Return ONLY the tag name.
      `;
      try {
        const result = await getChatResponse("", classificationPrompt, []);
        const classified = result.trim().toLowerCase();
        if (["feature", "bug", "improvement", "milestone", "general"].includes(classified)) {
          finalTag = classified as any;
        }
      } catch (e) {
        console.error("Classification failed", e);
      }
    }

    // Get AI response with STRICT formatting rules
    const systemPrompt = `
      You are Vamo, an AI co-founder for startups.
      Context:
      ${projectContext}

      Rules:
      1. Reply in PLAIN TEXT only. No markdown (no bold, no italics, no bullet points).
      2. No hashtags.
      3. ABSOLUTELY NO EMOJIS.
      4. Be concise, encouraging, and helpful.
    `;

    let aiResponse = await getChatResponse(
      systemPrompt,
      message,
      chatHistory
    );

    // POST-PROCESSING: Forcefully strip Markdown and Emojis
    // 1. Remove Markdown (*, **, _, ~, `, >)
    aiResponse = aiResponse.replace(/(\*\*|__|\*|_|~~|`|>|#)/g, "");
    
    // 2. Remove Markdown Links [text](url) -> text
    aiResponse = aiResponse.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    
    // 3. Remove Emojis (Unicode ranges)
    aiResponse = aiResponse.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "");

    // 4. Clean up double spaces created by removal
    aiResponse = aiResponse.replace(/\s+/g, " ").trim();

    // Calculate pineapple reward
    const rewardAmount = REWARD_AMOUNTS.chat_prompt ?? 5;
    const idempotencyKey = generateIdempotencyKey(
      user.id,
      projectId,
      "chat_prompt",
      userMsg?.id ?? Date.now().toString()
    );

    // If tag is 'milestone', generate a concise summary
    let summary: string | null = null;
    if (finalTag === "milestone") {
      try {
        const summaryPrompt = `
          The user just shared a startup milestone: "${message}".
          Rewrite this into a concise, professional notification title (max 5 words).
          Example: "Reached $10k MRR", "Launched Beta", "First 100 Users".
          Do not use quotes.
        `;
        const summaryResponse = await getChatResponse("", summaryPrompt, []);
        summary = summaryResponse.trim();
      } catch (e) {
        console.error("Failed to generate summary", e);
      }
    }

    // Insert AI response message
    // ... rest of the code
    const { data: assistantMsg } = await supabase
      .from("messages")
      .insert({
        project_id: projectId,
        role: "assistant",
        content: aiResponse,
        summary: summary, // Persist the summary
        tag: finalTag ?? "general",
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

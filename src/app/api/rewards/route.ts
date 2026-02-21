import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rewardSchema } from "@/lib/validators";
import { REWARD_AMOUNTS, MAX_REWARDS_PER_HOUR } from "@/lib/rewards";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = rewardSchema.safeParse(body);

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

    const { userId, projectId, eventType, idempotencyKey } = parsed.data;

    // Verify user matches
    if (userId !== user.id) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "User ID mismatch" } },
        { status: 403 }
      );
    }

    // Rate limit check: max rewards per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: rewardCount } = await supabase
      .from("reward_ledger")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", oneHourAgo);

    const isRateLimited = (rewardCount ?? 0) >= MAX_REWARDS_PER_HOUR;
    let amount = REWARD_AMOUNTS[eventType] ?? 5; // Use default if type not in map

    if (isRateLimited) {
      amount = 0; // Drop amount to 0 if rate limited
    }

    if (amount > 0) {
      // Insert reward (idempotent via unique key)
      const { error: insertError } = await supabase
        .from("reward_ledger")
        .insert({
          user_id: userId,
          project_id: projectId,
          event_type: eventType,
          amount,
          idempotency_key: idempotencyKey,
        });

      if (insertError) {
        // Duplicate idempotency key = already awarded
        if (insertError.code === "23505") {
          // fetch current profile balance to return
          const { data: profile } = await supabase
            .from("profiles")
            .select("pineapple_balance")
            .eq("id", userId)
            .single();
          return NextResponse.json({ rewarded: false, amount: 0, newBalance: profile?.pineapple_balance ?? 0, message: "Already awarded" });
        }
        throw insertError;
      }
    }

    let newBalance = 0;
    // Update pineapple balance (fetch current, then update)
    if (amount > 0) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("pineapple_balance")
        .eq("id", userId)
        .single();
        
      if (profile) {
        newBalance = profile.pineapple_balance + amount;
        await supabase
          .from("profiles")
          .update({
            pineapple_balance: newBalance,
          })
          .eq("id", userId);
      }
      
      // Log activity event
      await supabase.from("activity_events").insert({
        project_id: projectId,
        user_id: userId,
        event_type: "reward_earned",
        metadata: { event: eventType, amount },
      });
    } else {
      // Fetch balance anyway for the return payload
      const { data: profile } = await supabase
        .from("profiles")
        .select("pineapple_balance")
        .eq("id", userId)
        .single();
      newBalance = profile?.pineapple_balance ?? 0;
    }

    return NextResponse.json({ rewarded: true, amount, newBalance, message: amount > 0 ? "Reward granted" : "Rate limited or 0 amount" });
  } catch (err) {
    console.error("Rewards API error:", err);
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

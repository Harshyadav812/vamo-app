import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { redeemSchema } from "@/lib/validators";

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
    const parsed = redeemSchema.safeParse(body);

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

    const { amount } = parsed.data;

    // Check current balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("pineapple_balance")
      .eq("id", user.id)
      .single();

    if (!profile || profile.pineapple_balance < amount) {
      return NextResponse.json(
        {
          error: {
            code: "INSUFFICIENT_BALANCE",
            message: `You need ${amount} pineapples but have ${profile?.pineapple_balance ?? 0}`,
          },
        },
        { status: 400 }
      );
    }

    // Deduct balance
    await supabase
      .from("profiles")
      .update({
        pineapple_balance: profile.pineapple_balance - amount,
      })
      .eq("id", user.id);

    // Create redemption record
    const { data: redemption, error: redemptionError } = await supabase
      .from("redemptions")
      .insert({
        user_id: user.id,
        amount,
        status: "pending",
      })
      .select()
      .single();

    if (redemptionError) {
      // Roll back balance deduction
      await supabase
        .from("profiles")
        .update({
          pineapple_balance: profile.pineapple_balance,
        })
        .eq("id", user.id);
      throw redemptionError;
    }

    // Insert negative amount into reward_ledger to represent spend
    await supabase.from("reward_ledger").insert({
      user_id: user.id,
      event_type: "reward_redeemed", // Using a special string to denote redemption
      amount: -amount,
      idempotency_key: `redeem-${redemption.id}`, // Unique to this redemption
    });

    // Insert activity event
    await supabase.from("activity_events").insert({
      user_id: user.id,
      event_type: "reward_redeemed",
      metadata: { amount, redemption_id: redemption.id },
    });

    return NextResponse.json({
      redemption,
      newBalance: profile.pineapple_balance - amount,
    });
  } catch (err) {
    console.error("Redeem API error:", err);
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

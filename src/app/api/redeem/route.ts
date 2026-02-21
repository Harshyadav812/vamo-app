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

    // Use atomic RPC for redemption
    const idempotencyKey = `redeem-${Date.now()}-${amount}`; // Generating early since RPC handles redemption record
    
    interface RpcResponse {
      success: boolean;
      new_balance: number;
      redemption_id: string;
    }

    const { data: result, error: rpcError } = await supabase.rpc(
      "redeem_pineapples",
      {
        p_user_id: user.id,
        p_amount: amount,
        p_idempotency_key: idempotencyKey,
      }
    );

    if (rpcError) {
      if (rpcError.message.includes("Insufficient balance")) {
        return NextResponse.json(
          {
            error: {
              code: "INSUFFICIENT_BALANCE",
              message: "You do not have enough pineapples.",
            },
          },
          { status: 400 }
        );
      }
      throw rpcError;
    }

    const typedResult = result as unknown as RpcResponse;

    // Insert activity event (append-only timeline)
    await supabase.from("activity_events").insert({
      user_id: user.id,
      event_type: "reward_redeemed",
      metadata: { amount, redemption_id: typedResult.redemption_id },
    });

    return NextResponse.json({
      success: true,
      newBalance: typedResult.new_balance,
      redemption: { id: typedResult.redemption_id, amount, status: "pending" },
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

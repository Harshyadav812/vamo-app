import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WalletClient } from "./wallet-client";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, pineapple_balance")
    .eq("id", user.id)
    .single();

  const { data: rewards } = await supabase
    .from("reward_ledger")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: redemptions } = await supabase
    .from("redemptions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <WalletClient
      displayName={profile?.display_name ?? "User"}
      balance={profile?.pineapple_balance ?? 0}
      rewards={rewards ?? []}
      redemptions={redemptions ?? []}
      userId={user.id}
    />
  );
}

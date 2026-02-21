"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateRedemptionStatus(id: string, newStatus: "fulfilled" | "failed") {
  const supabase = await createClient();

  const { error } = await supabase
    .from("redemptions")
    .update({ 
      status: newStatus,
      fulfilled_at: newStatus === "fulfilled" ? new Date().toISOString() : null
    })
    .eq("id", id);
    
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/redemptions");
}

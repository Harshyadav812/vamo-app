import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = "https://cckrmhgmspcudqihrinh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JsT8rNqPcjqBVkOeqO22Og_jU0CWSZu";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase
    .from("listings")
    .select("id, title, description, asking_price, status, created_at, project_id, owner_id")
    .eq("status", "active");
    
  console.log("Error:", error);
  console.log("Data:", data);
}
main();

import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = "https://cckrmhgmspcudqihrinh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JsT8rNqPcjqBVkOeqO22Og_jU0CWSZu";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .limit(1);
  console.log("Profiles data:", data);
  console.log("Error:", error);
}

main();

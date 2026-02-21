import { createClient } from "@supabase/supabase-js";
const SUPABASE_URL = "https://cckrmhgmspcudqihrinh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JsT8rNqPcjqBVkOeqO22Og_jU0CWSZu";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const { data: listings } = await supabase
    .from("listings")
    .select("project_id")
    .eq("status", "active");

  const projectIds = listings?.map((l) => l.project_id) ?? [];
  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("id, name, description, url, progress_score")
    .in("id", projectIds);
      
  console.log("Projects Error:", projectsError);
  console.log("Projects Count:", projects?.length);
}
main();

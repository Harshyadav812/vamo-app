import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cckrmhgmspcudqihrinh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JsT8rNqPcjqBVkOeqO22Og_jU0CWSZu";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log("Fetching listings...");
  
  // Try to fetch all listings without filters first
  const { data: allListings, error: allError } = await supabase
    .from("listings")
    .select("*");
    
  if (allError) {
    console.error("Error fetching all listings:", allError);
  } else {
    console.log("All listings count:", allListings?.length);
    console.log("All listings:", allListings);
  }

  // Try to fetch active listings with specific columns (like page.tsx)
  const { data: activeListings, error: activeError } = await supabase
    .from("listings")
    .select("id, title, description, asking_price, status, created_at, project_id")
    .eq("status", "active");

  if (activeError) {
    console.error("Error fetching active listings:", activeError);
  } else {
    console.log("Active listings count:", activeListings?.length);
    console.log("Active listings:", activeListings);
  }
}

main();

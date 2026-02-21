import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://cckrmhgmspcudqihrinh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_JsT8rNqPcjqBVkOeqO22Og_jU0CWSZu";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  console.log("Fetching listings...");
  
  // Try to fetch all listings
  const { data: allListings, error: allError } = await supabase
    .from("listings")
    .select("*");
    
  if (allError) {
    console.error("Error fetching all listings:", allError);
  } else {
    console.log("All listings count:", allListings?.length);
  }

  // List storage buckets
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    console.error("Error listing buckets:", bucketsError);
  } else {
    console.log("Buckets:", buckets);
  }
}

main();

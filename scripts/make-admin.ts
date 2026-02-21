import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function makeAdmin() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/make-admin.ts <email>");
    process.exit(1);
  }

  console.log(`Setting is_admin=true for ${email}...`);
  
  const { data, error } = await supabase
    .from("profiles")
    .update({ is_admin: true })
    .eq("email", email)
    .select();

  if (error) {
    console.error("Error updating profile:", error.message);
  } else if (data && data.length > 0) {
    console.log("Success! User is now an admin.");
    console.log(data[0]);
  } else {
    console.log("User not found with that email.");
  }
}

makeAdmin();

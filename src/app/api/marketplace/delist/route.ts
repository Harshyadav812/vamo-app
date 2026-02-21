import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { listingId } = await req.json();

    if (!listingId) {
      return NextResponse.json({ error: "Missing listingId" }, { status: 400 });
    }

    // Fetch the listing to check ownership
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("owner_id, project_id")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    const isAdmin = profile?.is_admin === true;
    const isOwner = listing.owner_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this listing" },
        { status: 403 }
      );
    }

    // Update listing status to withdrawn
    const { error: updateError } = await supabase
      .from("listings")
      .update({ status: "withdrawn" })
      .eq("id", listingId);

    if (updateError) {
      console.error("Listing update error:", updateError);
      return NextResponse.json({ error: "Failed to remove listing" }, { status: 500 });
    }

    // Also update project to no longer be listed
    await supabase
      .from("projects")
      .update({ listed: false })
      .eq("id", listing.project_id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delist error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

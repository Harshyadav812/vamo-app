import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { offerSchema } from "@/lib/validators";
import { getValuationOffer } from "@/lib/ai";

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
    const parsed = offerSchema.safeParse(body);

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

    const { projectId } = parsed.data;

    // Fetch full project data
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("owner_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Project not found" } },
        { status: 404 }
      );
    }

    // Load all activity_events for project
    const { data: events } = await supabase
      .from("activity_events")
      .select("event_type, created_at, metadata")
      .eq("project_id", projectId)
      .order('created_at', { ascending: false });

    const activityEvents = events || [];

    // Calculate metrics
    const messageCount = activityEvents.filter(e => e.event_type === "chat_prompt").length;
    const linksCount = activityEvents.filter(e => ["url_added", "link_github", "link_linkedin", "link_website"].includes(e.event_type)).length;
    const tractionSignalCount = activityEvents.filter(e => ["feature_shipped", "customer_added", "revenue_logged"].includes(e.event_type)).length;

    const activitySummary = JSON.stringify({
      metrics: {
        messageCount,
        linksCount,
        tractionSignalCount,
        totalEvents: activityEvents.length
      },
      recentEvents: activityEvents.slice(0, 5) // Send a small subset to give context to the AI
    });

    // Use AI to generate valuation
    const offer = await getValuationOffer(
      project.name,
      project.description,
      activitySummary
    );

    // Expire old offers
    await supabase
      .from("offers")
      .update({ expired: true })
      .eq("project_id", projectId)
      .eq("expired", false);

    // Store new offer in database
    const { data: newOffer, error: insertError } = await supabase.from("offers").insert({
      project_id: projectId,
      user_id: user.id,
      low_range: offer.low_range,
      high_range: offer.high_range,
      reasoning: offer.reasoning,
      signals: offer.signals,
    }).select().single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    // Log the event
    await supabase.from("activity_events").insert({
      project_id: projectId,
      user_id: user.id,
      event_type: "offer_received",
      metadata: { low_range: offer.low_range, high_range: offer.high_range }
    });

    return NextResponse.json({
      offer: newOffer,
    });
  } catch (err) {
    console.error("Offer API error:", err);
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

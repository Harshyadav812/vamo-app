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

    // Fetch activity count for context
    const { count: activityCount } = await supabase
      .from("activity_events")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId);

    // Use AI to generate valuation
    const offer = await getValuationOffer(
      project.name,
      project.description,
      activityCount ?? 0,
      0, // evidence count placeholder
      !!project.url
    );

    // Store offer in database
    await supabase.from("offers").insert({
      project_id: projectId,
      buyer_id: null, // Vamo system offer
      amount: Math.round((offer.lowRange + offer.highRange) / 2) * 100,
      currency: "USD",
      status: "pending",
      notes: offer.reasoning,
    });

    return NextResponse.json({
      offer: {
        low_range: offer.lowRange,
        high_range: offer.highRange,
        rationale: offer.reasoning,
      },
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

import { NextRequest, NextResponse } from "next/server";
import { getListingDescription } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectName, projectDescription, metrics, whyBuilt } = body;

    if (!projectName) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const description = await getListingDescription(
      projectName,
      projectDescription,
      metrics || { progress: 0, prompts: 0, traction: 0 },
      whyBuilt
    );

    return NextResponse.json({ description });
  } catch (error) {
    console.error("Description generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate description" },
      { status: 500 }
    );
  }
}

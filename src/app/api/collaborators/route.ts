import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { inviteCollaboratorSchema, removeCollaboratorSchema } from "@/lib/validators";
import { REWARD_AMOUNTS } from "@/lib/rewards";

// GET /api/collaborators?projectId=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { error: { code: "BAD_REQUEST", message: "Missing projectId" } },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    // Since RLS handles authorization, we can just query directly
    // Join with profiles to get display info
    const { data: collaborators, error } = await supabase
      .from("collaborators")
      .select(`
        id,
        project_id,
        user_id,
        role,
        added_by,
        created_at,
        profile:profiles!inner (
          email,
          display_name,
          avatar_url
        )
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching collaborators:", error);
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to fetch collaborators" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ collaborators });
  } catch (error) {
    console.error("Collaborators GET error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch collaborators" } },
      { status: 500 }
    );
  }
}

// POST /api/collaborators (Invite)
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = inviteCollaboratorSchema.safeParse(body);

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

    const { projectId, email } = parsed.data;

    // Call the RPC to invite by email
    const { data, error } = await supabase.rpc("invite_collaborator_by_email", {
      p_project_id: projectId,
      p_email: email.toLowerCase(),
      p_role: "editor", // default to editor for now
    });

    if (error) {
      console.error("RPC Error:", error);
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to invite collaborator" } },
        { status: 500 }
      );
    }

    // The RPC returns { success: boolean, error?: string, user_id?: string }
    if (!data.success) {
      return NextResponse.json(
        { error: { code: "INVITE_FAILED", message: data.error || "Failed to invite collaborator" } },
        { status: 400 }
      );
    }

    // Award pineapples for adding a collaborator
    // Verify idempotency first? We can use project_id + target user_id as idempotency key
    const idempotencyKey = `invite-${projectId}-${data.user_id}`;
    
    await supabase.rpc("reward_pineapples", {
      p_user_id: user.id,
      p_project_id: projectId,
      p_event_type: "collaborator_added",
      p_amount: REWARD_AMOUNTS.collaborator_added || 10,
      p_idempotency_key: idempotencyKey,
    });

    return NextResponse.json({ success: true, userId: data.user_id });
  } catch (error) {
    console.error("Collaborators POST error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to invite collaborator" } },
      { status: 500 }
    );
  }
}

// DELETE /api/collaborators (Remove)
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = removeCollaboratorSchema.safeParse(body);

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

    const { projectId, userId: targetUserId } = parsed.data;

    // The RLS policy handles authorization for deletion
    // A user can delete if they are owner/admin, OR if they are removing themselves
    const { error } = await supabase
      .from("collaborators")
      .delete()
      .match({ project_id: projectId, user_id: targetUserId });

    if (error) {
      console.error("Delete Collaborator Error:", error);
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Failed to remove collaborator" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Collaborators DELETE error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to remove collaborator" } },
      { status: 500 }
    );
  }
}

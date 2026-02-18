import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Project, Profile, Message } from "@/lib/types";
import { BuilderWorkspace } from "@/modules/builder/ui/views/builder-workspace";

export const dynamic = "force-dynamic";

interface BuilderPageProps {
  params: Promise<{ projectId: string }>;
}

export default async function BuilderPage({ params }: BuilderPageProps) {
  const { projectId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("owner_id", user.id)
    .single();

  if (projectError || !project) {
    redirect("/projects");
  }

  // Fetch profile for pineapple balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch messages
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  // Fetch activity events count
  const { count: activityCount } = await supabase
    .from("activity_events")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  return (
    <BuilderWorkspace
      project={project as Project}
      profile={profile as Profile}
      initialMessages={(messages as Message[]) ?? []}
      activityCount={activityCount ?? 0}
      userId={user.id}
    />
  );
}

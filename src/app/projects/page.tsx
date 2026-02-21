import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, pineapple_balance")
    .eq("id", user.id)
    .single();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <Link href="/projects" className="text-xl font-bold tracking-tight">
          &gt;&gt;&gt; vamo
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 rounded-full border bg-white px-3 py-1.5 text-sm font-medium">
            {profile?.pineapple_balance ?? 0} <span className="text-lg leading-none">🍍</span>
          </div>
          <Link href="/wallet">
            <Button variant="ghost" size="sm">
              Wallet
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="ghost" size="sm">
              Marketplace
            </Button>
          </Link>
          <Link href="/profile">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-sm font-medium text-white hover:bg-zinc-700 transition-colors">
              {(profile?.display_name || user.email)?.[0]?.toUpperCase()}
            </div>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Your Projects</h2>
          <Link href="/projects/new">
            <Button>+ New Project</Button>
          </Link>
        </div>

        {!projects || projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium">No projects yet</p>
              <p className="mb-4 text-sm text-muted-foreground">
                Create your first project to start building and earning <span className="text-lg leading-none">🍍</span>
              </p>
              <Link href="/projects/new">
                <Button>Create Your First Project</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {(projects as Project[]).map((project) => (
              <Link key={project.id} href={`/builder/${project.id}`}>
                <Card className="transition-shadow hover:shadow-md cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription>
                      {project.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Progress: {project.progress_score}%</span>
                      <span>
                        {new Date(project.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

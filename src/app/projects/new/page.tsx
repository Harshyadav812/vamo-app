"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createProjectSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function NewProjectPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [whyBuilt, setWhyBuilt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate with Zod
    const parsed = createProjectSchema.safeParse({
      name,
      description: description || undefined,
      url: url || undefined,
      why_built: whyBuilt || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in");
      setLoading(false);
      return;
    }

    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert({
        owner_id: user.id,
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        url: parsed.data.url ?? null,
        why_built: parsed.data.why_built ?? null,
      })
      .select()
      .single();

    if (insertError || !project) {
      setError(insertError?.message ?? "Failed to create project");
      setLoading(false);
      return;
    }

    // Log activity event
    await supabase.from("activity_events").insert({
      project_id: project.id,
      user_id: user.id,
      event_type: "project_created",
      metadata: { name: project.name },
    });

    router.push(`/builder/${project.id}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <Link href="/projects" className="text-xl font-bold tracking-tight">
          &gt;&gt;&gt; vamo
        </Link>
      </header>

      <main className="mx-auto max-w-lg px-6 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
            <CardDescription>
              Tell us about your startup. You can always update this later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Arcotype"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What does your startup do?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Project URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://your-project.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whyBuilt">Why I Built This</Label>
                <Textarea
                  id="whyBuilt"
                  placeholder="What's the story behind this project?"
                  value={whyBuilt}
                  onChange={(e) => setWhyBuilt(e.target.value)}
                  rows={3}
                />
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Creating..." : "Create Project"}
                </Button>
                <Link href="/projects">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

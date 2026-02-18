import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch active listings with project info
  const { data: listings } = await supabase
    .from("listings")
    .select(`
      id,
      asking_price,
      currency,
      notes,
      status,
      created_at,
      project_id
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  // Fetch project details for each listing
  const projectIds = listings?.map((l) => l.project_id) ?? [];
  const { data: projects } = projectIds.length > 0
    ? await supabase
        .from("projects")
        .select("id, name, description, url, progress_score")
        .in("id", projectIds)
    : { data: [] };

  const projectMap = new Map(
    (projects ?? []).map((p) => [p.id, p])
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <Link href="/projects" className="text-xl font-bold tracking-tight">
          &gt;&gt;&gt; vamo
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/projects">
              <Button variant="ghost" size="sm">
                My Projects
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button size="sm">Log In</Button>
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="mt-1 text-muted-foreground">
            Discover and acquire projects built by founders on Vamo.
          </p>
        </div>

        {!listings || listings.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg font-medium">No listings yet</p>
              <p className="mb-4 text-sm text-muted-foreground">
                Be the first to list your project on the marketplace!
              </p>
              {user && (
                <Link href="/projects">
                  <Button>Go to Projects</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => {
              const project = projectMap.get(listing.project_id);
              return (
                <Card
                  key={listing.id}
                  className="transition-shadow hover:shadow-md"
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {project?.name ?? "Untitled Project"}
                      </CardTitle>
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        ${(listing.asking_price / 100).toLocaleString()}
                      </Badge>
                    </div>
                    <CardDescription>
                      {project?.description ?? "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Progress: {project?.progress_score ?? 0}%</span>
                      <span>
                        {new Date(listing.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {listing.notes && (
                      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {listing.notes}
                      </p>
                    )}
                    {user && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-3 w-full"
                      >
                        Make an Offer
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

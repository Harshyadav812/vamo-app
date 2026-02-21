import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketplaceClient } from "./marketplace-client";

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
      title,
      description,
      asking_price,
      status,
      created_at,
      project_id,
      owner_id
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  console.log("Marketplace listings fetch:", listings?.length);

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

  // Combine listing with project
  const combinedListings = (listings ?? []).map((l) => {
    const project = projectMap.get(l.project_id) as any;
    return {
      ...l,
      project,
      // Polyfill missing columns until migration is run
      metrics: {
        progress: project?.progress_score || 0,
        prompts: 0,
        traction: 0
      }, 
      images: [],
      allow_offers: true,
    };
  }).filter(l => l.project); // Ensure project exists

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <Link href="/projects" className="text-xl font-bold tracking-tight">
          &gt;&gt;&gt; vamo
        </Link>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/projects">
                <Button variant="ghost" size="sm">
                  My Projects
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  Profile
                </Button>
              </Link>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">Log In</Button>
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Marketplace</h1>
          <p className="mt-2 text-muted-foreground">
            Discover and acquire vetted early-stage projects.
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
           <MarketplaceClient listings={combinedListings} user={user} />
        )}
      </main>
    </div>
  );
}

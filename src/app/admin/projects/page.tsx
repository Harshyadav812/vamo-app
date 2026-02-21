import { createClient } from "@/lib/supabase/server";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export default async function AdminProjectsPage(props: {
  searchParams: Promise<{ user?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();
  const userFilter = searchParams.user;

  let query = supabase
    .from("projects")
    .select("*, profiles!inner (email)")
    .order("created_at", { ascending: false });

  if (userFilter) {
    query = query.eq("owner_id", userFilter);
  }

  const { data: projects } = await query;
  const items = projects || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-black">Projects</h1>
        {userFilter && (
          <Link href="/admin/projects" className="text-sm text-blue-600 hover:underline">
            Clear User Filter
          </Link>
        )}
      </div>

      <Card className="rounded-2xl border border-black/10 bg-white shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle>All Projects ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Progress</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      No projects found.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        <Link href={`/projects/${project.id}`} className="hover:underline text-blue-600">
                          {project.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {(project.profiles as any)?.email}
                      </TableCell>
                      <TableCell>
                        {project.listed ? (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">Listed</Badge>
                        ) : (
                          <Badge variant="secondary">Private</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {project.progress_score}%
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(project.created_at), "MMM d, yyyy")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminUsersPage() {
  const supabase = await createClient();

  // Fetch profiles with a count of their projects
  const { data: profiles } = await supabase
    .from("profiles")
    .select(`
      *,
      projects ( count )
    `)
    .order("created_at", { ascending: false });

  const users = profiles || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-black">Users</h1>
      </div>

      <Card className="rounded-2xl border border-black/10 bg-white shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle>All Registered Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Projects</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.display_name || "Unknown"}
                        {user.is_admin && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-800">
                            Admin
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell className="text-right font-medium text-orange-600">
                        {user.pineapple_balance.toLocaleString()} 🍍
                      </TableCell>
                      <TableCell className="text-right">
                        {user.projects?.[0]?.count || 0}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(user.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/projects?user=${user.id}`}>
                            View Projects
                          </Link>
                        </Button>
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

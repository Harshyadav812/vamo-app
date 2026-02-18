import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    redirect("/projects");
  }

  // Fetch stats
  const { count: userCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: projectCount } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true });

  const { count: listingCount } = await supabase
    .from("listings")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { data: pendingRedemptions } = await supabase
    .from("redemptions")
    .select("id, user_id, amount, status, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  // Recent users
  const { data: recentUsers } = await supabase
    .from("profiles")
    .select("id, display_name, email, pineapple_balance, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <Link href="/projects" className="text-xl font-bold tracking-tight">
          &gt;&gt;&gt; vamo
        </Link>
        <Badge variant="destructive">Admin</Badge>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold">Admin Dashboard</h1>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{userCount ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{projectCount ?? 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Listings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{listingCount ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Redemptions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Pending Redemptions</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(!pendingRedemptions || pendingRedemptions.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No pending redemptions
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingRedemptions.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">
                        {r.user_id.substring(0, 8)}...
                      </TableCell>
                      <TableCell className="font-medium">
                        {r.amount} 🍍
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>🍍 Balance</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(recentUsers ?? []).map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.display_name}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="font-medium">
                      {u.pineapple_balance} 🍍
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

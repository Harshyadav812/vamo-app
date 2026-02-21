import { createClient } from "@/lib/supabase/server";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { RedemptionActions } from "./redemption-actions";

export default async function AdminRedemptionsPage() {
  const supabase = await createClient();

  // Fetch pending redemptions with user details
  const { data: redemptions } = await supabase
    .from("redemptions")
    .select(`
      *,
      profiles!inner ( email )
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const items = redemptions || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-black">Pending Redemptions</h1>
      </div>

      <Card className="rounded-2xl border border-black/10 bg-white shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle>Needs Action ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User Email</TableHead>
                  <TableHead className="text-right">Amount (🍍)</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      No pending redemptions.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {(item.profiles as any)?.email}
                      </TableCell>
                      <TableCell className="text-right font-medium text-orange-600">
                        {item.amount.toLocaleString()} 🍍
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(item.created_at), "MMM d, yyyy h:mm a")}
                      </TableCell>
                      <TableCell className="text-right">
                        <RedemptionActions id={item.id} />
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

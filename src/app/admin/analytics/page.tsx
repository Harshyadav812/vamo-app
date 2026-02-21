import { createClient } from "@/lib/supabase/server";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnalyticsFilters } from "./filters";

export default async function AdminAnalyticsPage(props: {
  searchParams: Promise<{ page?: string; event?: string }>;
}) {
  const searchParams = await props.searchParams;
  const supabase = await createClient();

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = 20;
  const eventFilter = searchParams.event;

  let query = supabase
    .from("analytics_events")
    .select("*, profiles!left (email)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

  if (eventFilter && eventFilter !== "all") {
    query = query.eq("event_name", eventFilter);
  }

  const { data: events, count } = await query;

  const totalPages = count ? Math.ceil(count / itemsPerPage) : 0;
  const items = events || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-black">Analytics</h1>
        <AnalyticsFilters currentFilter={eventFilter || "all"} />
      </div>

      <Card className="rounded-2xl border border-black/10 bg-white shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle>Event Log ({count})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Properties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                      No events found.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(event.created_at), "MMM d, HH:mm:ss")}
                      </TableCell>
                      <TableCell className="font-medium">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                          {event.event_name}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {(event.profiles as any)?.email || "Anonymous"}
                      </TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground max-w-[300px] truncate">
                        {JSON.stringify(event.properties)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                asChild
              >
                <Link href={`/admin/analytics?page=${currentPage - 1}${eventFilter ? `&event=${eventFilter}` : ''}`}>
                  Previous
                </Link>
              </Button>
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                asChild
              >
                <Link href={`/admin/analytics?page=${currentPage + 1}${eventFilter ? `&event=${eventFilter}` : ''}`}>
                  Next
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

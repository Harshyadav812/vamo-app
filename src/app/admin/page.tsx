import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Users, FolderGit2, MessageSquare, Ticket, ShoppingCart, Store, ArrowUpRight } from "lucide-react";

function MetricCard({ title, value, icon: Icon, trend, colorClass }: any) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-md transition-all duration-300 border border-black/10 bg-white rounded-2xl shadow-sm">
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] group-hover:opacity-[0.06] transition-opacity ${colorClass}`} />
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black tracking-tight text-black">{value}</p>
              {trend && (
                <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  {trend} <ArrowUpRight className="h-3 w-3 ml-0.5" />
                </span>
              )}
            </div>
          </div>
          <div className={`flex size-14 items-center justify-center rounded-2xl bg-[#fafafa] border border-black/10 shadow-sm text-black group-hover:-translate-y-1 transition-transform`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AdminOverviewPage() {
  const supabase = await createClient();

  // Fetch metrics concurrently
  const [
    { count: usersCount },
    { count: projectsCount },
    { count: activeListingsCount },
    { data: events },
    { data: pineapplesData },
    { data: redemptionsData }
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("activity_events").select("event_type").eq("event_type", "chat_prompt"),
    supabase.from("reward_ledger").select("amount"),
    supabase.from("redemptions").select("amount").in("status", ["fulfilled", "pending"]),
  ]);

  const promptsCount = events?.length || 0;
  
  // Calculate total pineapples earned (only positive ledger entries)
  const totalPineapplesEarned = pineapplesData?.reduce((sum, item) => sum + (item.amount > 0 ? item.amount : 0), 0) || 0;
  
  // Calculate total pineapples completely redeemed (pending and fulfilled)
  const totalPineapplesRedeemed = redemptionsData?.reduce((sum, item) => sum + item.amount, 0) || 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-black">Overview Dashboard</h1>
        <p className="text-zinc-500 font-medium leading-relaxed mt-1">Key metrics and platform activity overview.</p>
      </div>
      
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard 
          title="Total Users" 
          value={usersCount?.toLocaleString() || 0} 
          icon={Users} 
          trend="+12%"
          // colorClass="bg-blue-500" 
        />
        <MetricCard 
          title="Total Projects" 
          value={projectsCount?.toLocaleString() || 0} 
          icon={FolderGit2} 
          trend="+24%"
          // colorClass="bg-indigo-500" 
        />
        <MetricCard 
          title="Active Listings" 
          value={activeListingsCount?.toLocaleString() || 0} 
          icon={Store} 
          // colorClass="bg-emerald-500" 
        />
        <MetricCard 
          title="Prompts Sent" 
          value={promptsCount.toLocaleString()} 
          icon={MessageSquare} 
          trend="+18%"
          // colorClass="bg-violet-500" 
        />
        <MetricCard 
          title="Pineapples Earned" 
          value={totalPineapplesEarned.toLocaleString()} 
          icon={Ticket} 
          trend="+41%"
          // colorClass="bg-amber-900" 
        />
        <MetricCard 
          title="Pineapples Redeemed" 
          value={totalPineapplesRedeemed.toLocaleString()} 
          icon={ShoppingCart} 
          // colorClass="bg-red-900" 
        />
      </div>
    </div>
  );
}

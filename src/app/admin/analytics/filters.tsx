"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActivityEventType } from "@/lib/types";

const TRACKED_EVENTS = [
  "all",
  "page_view",
  "project_created",
  "prompt_sent",
  "reward_earned",
  "reward_redeemed",
  "listing_created",
  "offer_requested",
  "link_added"
];

export function AnalyticsFilters({ currentFilter }: { currentFilter: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onFilterChange(val: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (val === "all") {
      params.delete("event");
    } else {
      params.set("event", val);
    }
    router.push(`/admin/analytics?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Filter by Event:</span>
      <Select value={currentFilter} onValueChange={onFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All events" />
        </SelectTrigger>
        <SelectContent>
          {TRACKED_EVENTS.map(ev => (
            <SelectItem key={ev} value={ev}>
              {ev === "all" ? "All Events" : ev}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

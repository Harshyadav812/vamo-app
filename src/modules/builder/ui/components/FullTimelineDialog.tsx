"use client";

import { useState, useMemo, type ReactNode } from "react";
import type { ActivityEvent } from "@/lib/types";
import { formatDistanceToNowStrict, format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Filter, MessageSquare, Link2, FileText, Tag, Users, BarChart3, Store, DollarSign, User, Rocket, Check, Pin } from "lucide-react";

const EVENT_LABELS: Record<string, string> = {
  chat_prompt: "Chat message sent",
  url_added: "Project URL linked",
  description_added: "Description added",
  industry_added: "Industry tagged",
  collaborator_added: "Collaborator invited",
  evidence_added: "Evidence uploaded",
  testimonial_added: "Testimonial shared",
  listing_created: "Listed for sale",
  offer_received: "Offer received",
  profile_updated: "Profile updated",
  feature_shipped: "Feature shipped",
  customer_added: "Customer added",
  revenue_logged: "Revenue logged",
  reward_earned: "Reward earned",
  reward_redeemed: "Reward redeemed"
};

const EVENT_ICONS: Record<string, ReactNode> = {
  chat_prompt: <MessageSquare className="h-4 w-4" />,
  url_added: <Link2 className="h-4 w-4" />,
  description_added: <FileText className="h-4 w-4" />,
  industry_added: <Tag className="h-4 w-4" />,
  collaborator_added: <Users className="h-4 w-4" />,
  evidence_added: <BarChart3 className="h-4 w-4" />,
  testimonial_added: <MessageSquare className="h-4 w-4" />,
  listing_created: <Store className="h-4 w-4" />,
  offer_received: <DollarSign className="h-4 w-4" />,
  profile_updated: <User className="h-4 w-4" />,
  feature_shipped: <Rocket className="h-4 w-4" />,
  customer_added: <Users className="h-4 w-4" />,
  revenue_logged: <DollarSign className="h-4 w-4" />,
  reward_earned: <span className="text-sm">🍍</span>,
  reward_redeemed: <span className="text-sm">🍍</span>,
};

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60000) return "just now";
    return formatDistanceToNowStrict(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

interface FullTimelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityEvents: ActivityEvent[];
}

export function FullTimelineDialog({
  open,
  onOpenChange,
  activityEvents,
}: FullTimelineDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const uniqueEventTypes = useMemo(() => {
    const types = new Set(activityEvents.map(e => e.event_type));
    return Array.from(types).sort();
  }, [activityEvents]);

  const filteredEvents = useMemo(() => {
    let filtered = [...activityEvents];

    // Filter by type
    if (selectedType !== "all") {
      filtered = filtered.filter(e => e.event_type === selectedType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(e => {
        const typeLabel = (EVENT_LABELS[e.event_type] || e.event_type).toLowerCase();
        // search JSON metadata values as string
        const metadataStr = JSON.stringify(e.metadata || {}).toLowerCase();
        return typeLabel.includes(q) || metadataStr.includes(q);
      });
    }

    // Sort ascending (oldest first) per requirements for full view
    filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return filtered;
  }, [activityEvents, searchQuery, selectedType]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <div className="p-6 pb-2 shrink-0">
          <DialogHeader>
            <DialogTitle className="text-xl">Full Activity Timeline</DialogTitle>
            <DialogDescription>
              Chronological log of all actions and milestones on your project.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex shrink-0 items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">All Event Types</option>
                {uniqueEventTypes.map(type => (
                  <option key={type} value={type}>
                    {EVENT_LABELS[type] || type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-6 pt-2">
          {filteredEvents.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground rounded-lg border border-dashed">
              No events found matching your filters.
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line connecting timeline */}
              <div className="absolute left-[19px] top-4 bottom-4 w-px bg-gray-200" />
              
              <div className="space-y-6">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="flex gap-4 relative">
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white border border-gray-200 shadow-sm text-gray-600">
                      {EVENT_ICONS[event.event_type] || <Pin className="h-4 w-4" />}
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-1.5 space-y-1">
                      <div className="flex sm:items-center justify-between gap-2 flex-col sm:flex-row">
                        <p className="text-sm font-medium text-gray-900">
                          {EVENT_LABELS[event.event_type] || event.event_type}
                        </p>
                        <time className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(event.created_at), "MMM d, yyyy h:mm a")} ({timeAgo(event.created_at)})
                        </time>
                      </div>
                      
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div className="text-sm text-gray-600 bg-gray-50 rounded p-2.5 mt-1 border">
                           {event.metadata.description ? <p className="mb-1"><strong>Description:</strong> {String(event.metadata.description)}</p> : null}
                           {event.metadata.name ? <p className="mb-1"><strong>Name:</strong> {String(event.metadata.name)}</p> : null}
                           {event.metadata.value ? <p className="mb-1 line-clamp-2"><strong>Value:</strong> {String(event.metadata.value)}</p> : null}
                           {event.metadata.amount ? <p className="mb-1"><strong>Amount:</strong> {String(event.metadata.amount)}</p> : null}
                           
                           {/* Fallback code payload for specific keys not destructured above */}
                           <details className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
                             <summary>Raw Metadata</summary>
                             <pre className="mt-2 text-[10px] overflow-x-auto bg-gray-100 p-2 rounded">
                               {JSON.stringify(event.metadata, null, 2)}
                             </pre>
                           </details>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

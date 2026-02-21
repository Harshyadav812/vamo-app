"use client";

import { useState } from "react";
import { Project, Listing } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { LineChart, MessageSquare, Zap, AlertTriangle, ExternalLink } from "lucide-react";

interface MarketplaceClientProps {
  listings: (Listing & { project: Project })[];
  user: any;
}

export function MarketplaceClient({ listings, user }: MarketplaceClientProps) {
  const [selectedListing, setSelectedListing] = useState<(Listing & { project: Project }) | null>(null);

  const isOutdated = (snapshotDate: string) => {
    if (!snapshotDate) return false;
    const days = (new Date().getTime() - new Date(snapshotDate).getTime()) / (1000 * 3600 * 24);
    return days > 7;
  };

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing) => {
          const metrics = listing.metrics || {};
          const image = listing.images?.[0] || listing.project.screenshot_url;
          const outdated = isOutdated(metrics.snapshot_date);

          return (
            <Card
              key={listing.id}
              className="group overflow-hidden transition-all hover:shadow-lg hover:border-green-200 cursor-pointer"
              onClick={() => setSelectedListing(listing)}
            >
              <div className="aspect-video w-full bg-gray-100 relative overflow-hidden">
                {image ? (
                  <img
                    src={image}
                    alt={listing.title}
                    className="object-cover w-full h-full transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-gray-300">
                    <Zap className="w-12 h-12" />
                  </div>
                )}
                {outdated && (
                  <div className="absolute top-2 right-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full flex items-center shadow-sm border border-amber-200">
                    <AlertTriangle className="w-3 h-3 mr-1" /> Outdated
                  </div>
                )}
              </div>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg line-clamp-1">{listing.title}</CardTitle>
                  <Badge variant="outline" className="font-mono text-green-700 bg-green-50 border-green-200 shrink-0">
                    ${((listing.asking_price || 0) / 100).toLocaleString()}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2 text-xs">
                  {listing.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground mt-2 bg-gray-50 p-2 rounded-md">
                   <div className="flex flex-col items-center">
                     <span className="font-bold text-gray-900">{metrics.progress || 0}%</span>
                     <span className="scale-90">Progress</span>
                   </div>
                   <div className="flex flex-col items-center">
                     <span className="font-bold text-gray-900">{metrics.prompts || 0}</span>
                     <span className="scale-90">Prompts</span>
                   </div>
                   <div className="flex flex-col items-center">
                     <span className="font-bold text-gray-900">{metrics.traction || 0}</span>
                     <span className="scale-90">Signals</span>
                   </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Sheet open={!!selectedListing} onOpenChange={(open) => !open && setSelectedListing(null)}>
        <SheetContent className="sm:max-w-xl w-full flex flex-col p-0 h-full overflow-hidden">
          {selectedListing && (
            <>
              <div className="flex-1 overflow-y-auto p-6 pt-10 flex flex-col gap-6">
                
                {/* Image */}
                <div className="aspect-video shrink-0 w-full bg-slate-100 rounded-lg overflow-hidden border relative flex items-center justify-center">
                   {(selectedListing.images?.[0] || selectedListing.project.screenshot_url) ? (
                      <img 
                        src={selectedListing.images?.[0] || selectedListing.project.screenshot_url || ""} 
                        className="w-full h-full object-cover" 
                        alt={selectedListing.title}
                      />
                   ) : (
                      <Zap className="w-16 h-16 text-slate-300" />
                   )}
                </div>

                {/* Header Info */}
                <div className="shrink-0 space-y-2">
                  <Badge variant="secondary" className="mb-2">
                     Listed {new Date(selectedListing.created_at).toLocaleDateString()}
                  </Badge>
                  <SheetTitle className="text-2xl mt-0">{selectedListing.title}</SheetTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-lg px-3 py-1 border-green-200 text-green-700 bg-green-50">
                      ${((selectedListing.asking_price || 0) / 100).toLocaleString()}
                    </Badge>
                    {isOutdated(selectedListing.metrics?.snapshot_date) && (
                       <Badge variant="destructive" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">
                         <AlertTriangle className="w-3 h-3 mr-1" /> Update Available
                       </Badge>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2 shrink-0">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Description</h4>
                  <p className="text-sm leading-relaxed whitespace-pre-line text-gray-700">
                    {selectedListing.description}
                  </p>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-4 shrink-0">
                  <MetricCard 
                    icon={<LineChart className="w-4 h-4 text-green-600"/>}
                    label="Progress"
                    value={`${selectedListing.metrics?.progress || 0}%`}
                  />
                  <MetricCard 
                    icon={<MessageSquare className="w-4 h-4 text-blue-600"/>}
                    label="Prompts"
                    value={selectedListing.metrics?.prompts || 0}
                  />
                  <MetricCard 
                    icon={<Zap className="w-4 h-4 text-orange-600"/>}
                    label="Traction"
                    value={selectedListing.metrics?.traction || 0}
                  />
                </div>
                
                {/* Live Demo */}
                {selectedListing.project.url && (
                  <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-between border shrink-0">
                    <div className="text-sm">
                      <span className="font-medium">Live Demo: </span>
                      <a href={selectedListing.project.url} target="_blank" className="text-blue-600 hover:underline">
                        {selectedListing.project.url}
                      </a>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </div>
                )}

                {/* Activity Snapshot */}
                <div className="space-y-4 pt-4 border-t shrink-0 mb-4">
                   <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Activity Snapshot</h4>
                   <div className="space-y-4 pl-2 border-l-2 border-slate-200">
                      <TimelineItem 
                         title={`Reached ${selectedListing.metrics?.traction || 0} traction signals`}
                         date={selectedListing.metrics?.snapshot_date}
                         icon={<Zap className="w-3 h-3 text-white"/>}
                         color="bg-orange-500"
                      />
                       <TimelineItem 
                         title={`Achieved ${selectedListing.metrics?.progress || 0}% development progress`}
                         date={selectedListing.metrics?.snapshot_date}
                         icon={<LineChart className="w-3 h-3 text-white"/>}
                         color="bg-green-500"
                      />
                       <TimelineItem 
                         title={`Listing Created`}
                         date={selectedListing.created_at}
                         icon={<CheckCircle2Icon className="w-3 h-3 text-white"/>}
                         color="bg-slate-500"
                      />
                   </div>
                </div>

              </div>

              {/* Sticky Footer */}
              <div className="shrink-0 p-6 border-t bg-white">
                 {user ? (
                   <Button className="w-full bg-green-600 hover:bg-green-700 text-lg py-6 shadow-lg shadow-green-900/10">
                     Make an Offer
                   </Button>
                 ) : (
                   <Button variant="secondary" className="w-full" disabled>
                     Log in to Buy
                   </Button>
                 )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function MetricCard({ icon, label, value }: any) {
  return (
    <div className="bg-white border rounded-lg p-3 shadow-sm flex flex-col items-center justify-center text-center">
      <div className="mb-2 p-2 bg-gray-50 rounded-full">{icon}</div>
      <span className="text-xl font-bold block">{value}</span>
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
    </div>
  );
}

function TimelineItem({ title, date, icon, color }: any) {
  return (
    <div className="relative pl-6 pb-2">
      <div className={`absolute -left-[9px] top-1 w-5 h-5 rounded-full flex items-center justify-center ${color} ring-4 ring-white`}>
        {icon}
      </div>
      <div className="flex flex-col">
         <span className="text-sm font-medium">{title}</span>
         {date && <span className="text-xs text-muted-foreground">{new Date(date).toLocaleDateString()}</span>}
      </div>
    </div>
  );
}

function CheckCircle2Icon(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    );
  }

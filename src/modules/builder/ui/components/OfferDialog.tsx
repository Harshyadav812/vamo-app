"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface OfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  userId: string;
  activityCount: number;
}

export function OfferDialog({
  open,
  onOpenChange,
  project,
  userId,
  activityCount,
}: OfferDialogProps) {
  const [loading, setLoading] = useState(false);
  const [offer, setOffer] = useState<{
    low_range: number;
    high_range: number;
    rationale: string;
  } | null>(null);

  async function handleGetOffer() {
    setLoading(true);
    try {
      const res = await fetch("/api/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Failed to get offer");
      }

      const data = await res.json();
      setOffer(data.offer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to get offer";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Get Vamo Offer</DialogTitle>
          <DialogDescription>
            AI-powered valuation for &quot;{project.name}&quot;
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!offer ? (
            <>
              <div className="rounded-lg border bg-gray-50 p-4 text-sm text-muted-foreground">
                <p>
                  Our AI will analyze your project based on:
                </p>
                <ul className="mt-2 space-y-1">
                  <li>• Project description & industry</li>
                  <li>• Progress score ({project.progress_score}%)</li>
                  <li>• Activity ({activityCount} events)</li>
                  <li>• Project URL & evidence</li>
                </ul>
              </div>
              <Button
                onClick={handleGetOffer}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Analyzing..." : "Get Valuation Offer"}
              </Button>
            </>
          ) : (
            <>
              <div className="rounded-lg border bg-green-50 p-4 text-center">
                <p className="text-sm text-green-700">Estimated Value</p>
                <p className="text-2xl font-bold text-green-800">
                  ${offer.low_range.toLocaleString()} – ${offer.high_range.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border p-4 text-sm">
                <p className="font-medium">Rationale</p>
                <p className="mt-1 text-muted-foreground">{offer.rationale}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setOffer(null);
                    onOpenChange(false);
                  }}
                >
                  Close
                </Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700">
                  Accept Offer
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

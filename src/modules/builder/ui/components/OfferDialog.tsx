"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
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
  onAcceptOffer: () => void;
}

export function OfferDialog({
  open,
  onOpenChange,
  project,
  userId,
  onAcceptOffer,
}: OfferDialogProps) {
  const [loading, setLoading] = useState(false);
  const [offer, setOffer] = useState<{
    low_range: number;
    high_range: number;
    reasoning: string;
    signals: string[];
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
      
      // Track analytics event
      trackEvent("offer_requested", { projectId: project.id, offerId: data.offer?.id || null });
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
                  <li>• Project activity & traction signals</li>
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
                  ${(offer?.low_range || 1000).toLocaleString()} – ${(offer?.high_range || 5000).toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg border p-4 text-sm">
                <p className="font-medium">Rationale</p>
                <p className="mt-1 text-muted-foreground">{offer.reasoning}</p>
              </div>
              
              {offer.signals && offer.signals.length > 0 && (
                <div className="rounded-lg border p-4 text-sm">
                  <p className="font-medium">Signals Analyzed</p>
                  <ul className="mt-1 text-muted-foreground list-disc list-inside space-y-1">
                    {offer.signals.map((signal, idx) => (
                      <li key={idx}>{signal.replace(/_/g, " ")}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground italic text-center">
                This is a non-binding estimate based on your logged activity.
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setOffer(null);
                    onOpenChange(false);
                  }}
                >
                  Dismiss
                </Button>
                <Button 
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    onOpenChange(false);
                    setOffer(null);
                    // Open listing dialog via prop
                    onAcceptOffer();
                  }}
                >
                  List for Sale
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

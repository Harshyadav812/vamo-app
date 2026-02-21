"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updateRedemptionStatus } from "./actions";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export function RedemptionActions({ id }: { id: string }) {
  const [loading, setLoading] = useState<"fulfilled" | "failed" | null>(null);

  async function handleAction(status: "fulfilled" | "failed") {
    setLoading(status);
    try {
      await updateRedemptionStatus(id, status);
      toast.success(`Redemption marked as ${status}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        className="text-green-600 hover:text-green-700 hover:bg-green-50"
        disabled={loading !== null}
        onClick={() => handleAction("fulfilled")}
      >
        {loading === "fulfilled" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
        Mark Fulfilled
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
        disabled={loading !== null}
        onClick={() => handleAction("failed")}
      >
        {loading === "failed" ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
        Mark Failed
      </Button>
    </div>
  );
}

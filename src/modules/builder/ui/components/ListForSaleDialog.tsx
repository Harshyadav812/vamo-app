"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ListForSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  userId: string;
}

export function ListForSaleDialog({
  open,
  onOpenChange,
  project,
  userId,
}: ListForSaleDialogProps) {
  const [askingPrice, setAskingPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("listings").insert({
        project_id: project.id,
        owner_id: userId,
        title: project.name,
        description: notes || "No description provided",
        asking_price: parseInt(askingPrice, 10) * 100, // store in cents
      });

      if (error) throw error;

      // Mark project as listed
      await supabase
        .from("projects")
        .update({ listed: true })
        .eq("id", project.id);

      toast.success("Project listed!", {
        description: "Your project is now visible on the marketplace.",
      });
      onOpenChange(false);
      onOpenChange(false);
    } catch (err) {
      console.error("List for sale error:", err);
      const msg = err instanceof Error ? err.message : "Failed to list project";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>List for Sale</DialogTitle>
          <DialogDescription>
            List &quot;{project.name}&quot; on the Vamo marketplace.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="askingPrice">Asking Price (USD)</Label>
            <Input
              id="askingPrice"
              type="number"
              min="1"
              placeholder="10000"
              value={askingPrice}
              onChange={(e) => setAskingPrice(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional details for potential buyers..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !askingPrice}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Listing..." : "List for Sale"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

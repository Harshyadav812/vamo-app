"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Project, ActivityEvent } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Sparkles, Image as ImageIcon, LineChart, DollarSign, CheckCircle2 } from "lucide-react";

interface ListForSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  userId: string;
  activityEvents: ActivityEvent[];
}

export function ListForSaleDialog({
  open,
  onOpenChange,
  project,
  userId,
  activityEvents,
}: ListForSaleDialogProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const supabase = createClient();

  // Form State
  const [description, setDescription] = useState(project.description || "");
  const [askingPrice, setAskingPrice] = useState("");
  const [imageUrl, setImageUrl] = useState(project.screenshot_url || "");
  const [metrics, setMetrics] = useState({
    progress: project.progress_score,
    prompts: 0,
    traction: 0,
    snapshot_date: new Date().toISOString(),
  });

  // Calculate metrics on open
  useEffect(() => {
    if (open) {
      const promptCount = activityEvents.filter((e) => e.event_type === "chat_prompt").length;
      // "Traction" is vague, let's count anything that isn't just a basic prompt
      const tractionCount = activityEvents.filter(
        (e) =>
          e.event_type !== "chat_prompt" &&
          e.event_type !== "profile_updated"
      ).length;

      setMetrics({
        progress: project.progress_score,
        prompts: promptCount,
        traction: tractionCount,
        snapshot_date: new Date().toISOString(),
      });
      setStep(1); // Reset to start
      setDescription(project.description || "");
    }
  }, [open, project, activityEvents]);

  async function handleGenerateDescription() {
    setAiGenerating(true);
    try {
      const res = await fetch("/api/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: project.name,
          projectDescription: project.description,
          metrics,
          whyBuilt: project.why_built,
        }),
      });

      const data = await res.json();
      if (data.description) {
        setDescription(data.description);
        toast.success("Description generated!");
      } else {
        throw new Error("No description returned");
      }
    } catch (err) {
      toast.error("Failed to generate description");
      console.error(err);
    } finally {
      setAiGenerating(false);
    }
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const { error } = await supabase.from("listings").insert({
        project_id: project.id,
        owner_id: userId,
        title: project.name,
        description: description,
        asking_price: parseInt(askingPrice, 10) * 100, // cents
        status: "active",
        images: imageUrl ? [imageUrl] : [],
        metrics: metrics,
        allow_offers: true,
      });

      if (error) throw error;

      await supabase
        .from("projects")
        .update({ listed: true })
        .eq("id", project.id);

      toast.success("Project listed successfully!", {
        description: "Your project is now live on the marketplace.",
      });
      onOpenChange(false);
    } catch (err) {
      console.error("List for sale error:", err);
      toast.error("Failed to list project");
    } finally {
      setLoading(false);
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 1: // Description & AI
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800 flex flex-col gap-2">
              <div className="flex items-center gap-2 font-semibold">
                <Sparkles className="w-4 h-4" />
                AI Pitch Assistant
              </div>
              <p>
                Let Vamo write a high-converting description based on your progress and metrics.
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="w-full bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-200"
                onClick={handleGenerateDescription}
                disabled={aiGenerating}
              >
                {aiGenerating ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" /> Generating...
                  </>
                ) : (
                  "Generate Professional Pitch"
                )}
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Project Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder="Describe your project, tech stack, and value..."
              />
            </div>
          </div>
        );
      case 2: // Metrics Review
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Performance Snapshot</Label>
              <p className="text-sm text-muted-foreground">
                These metrics will be displayed on your listing to prove engagement.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                <LineChart className="w-5 h-5 mb-2 text-green-600" />
                <span className="text-2xl font-bold">{metrics.progress}%</span>
                <span className="text-xs text-muted-foreground">Progress</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                <MessageSquareIcon className="w-5 h-5 mb-2 text-blue-600" />
                <span className="text-2xl font-bold">{metrics.prompts}</span>
                <span className="text-xs text-muted-foreground">Prompts</span>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg flex flex-col items-center justify-center text-center">
                <ZapIcon className="w-5 h-5 mb-2 text-orange-600" />
                <span className="text-2xl font-bold">{metrics.traction}</span>
                <span className="text-xs text-muted-foreground">Signals</span>
              </div>
            </div>
             <p className="text-xs text-gray-500 text-center">
               Data snapshot taken: {new Date(metrics.snapshot_date).toLocaleDateString()}
             </p>
          </div>
        );
      case 3: // Visuals
        return (
          <div className="space-y-4">
             <div className="bg-gray-50 border rounded-lg p-6 flex flex-col items-center justify-center text-center gap-4 relative">
                {imageUrl ? (
                  <div className="relative group">
                    <img src={imageUrl} alt="Preview" className="max-h-48 rounded shadow-sm object-cover" />
                    <button 
                      onClick={() => setImageUrl("")}
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 cursor-pointer relative w-full h-32 justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-100 transition-colors">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">Click to upload screenshot</span>
                    <span className="text-xs text-gray-400">Max size: 400KB</span>
                    <input 
                      type="file" 
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        // Validate size (400kb)
                        if (file.size > 400 * 1024) {
                           toast.error("File excessively large. Please upload an image under 400KB.");
                           return;
                        }

                        // Start upload
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${project.id}-${Date.now()}.${fileExt}`;
                        const filePath = `${fileName}`;

                        const loadingToast = toast.loading("Uploading image...");

                        try {
                           const { error: uploadError } = await supabase.storage
                             .from('project_images')
                             .upload(filePath, file);

                           if (uploadError) throw uploadError;

                           const { data } = supabase.storage
                             .from('project_images')
                             .getPublicUrl(filePath);

                           setImageUrl(data.publicUrl);
                           toast.success("Image uploaded successfully!", { id: loadingToast });
                        } catch (err: any) {
                           toast.error(err.message || "Failed to upload image", { id: loadingToast });
                        }
                      }}
                    />
                  </div>
                )}
             </div>
          </div>
        );
      case 4: // Pricing
        return (
          <div className="space-y-4">
             <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
                <Label className="text-green-800">Asking Price (USD)</Label>
                <div className="relative mt-2 max-w-xs mx-auto">
                  <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
                  <Input
                    type="number"
                    className="pl-10 text-lg font-bold h-12"
                    placeholder="10000"
                    value={askingPrice}
                    onChange={(e) => setAskingPrice(e.target.value)}
                  />
                </div>
                <p className="text-xs text-green-700 mt-2">
                  A fair price attracts serious buyers. Vamo estimated $1k-$5k.
                </p>
             </div>
          </div>
        );
      case 5: // Review
        return (
          <div className="space-y-4">
            <div className="border rounded-lg p-4 space-y-3">
               <h3 className="font-semibold text-lg">{project.name}</h3>
               <p className="text-2xl font-bold text-green-700">
                 ${parseInt(askingPrice || "0").toLocaleString()}
               </p>
               <p className="text-sm text-gray-600 line-clamp-3">
                 {description}
               </p>
               <div className="flex gap-4 text-sm text-gray-500 pt-2 border-t">
                 <span className="flex items-center gap-1"><LineChart className="w-3 h-3"/> {metrics.progress}%</span>
                 <span className="flex items-center gap-1"><MessageSquareIcon className="w-3 h-3"/> {metrics.prompts} prompts</span>
                 <span className="flex items-center gap-1"><ZapIcon className="w-3 h-3"/> {metrics.traction} signals</span>
               </div>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Listing will be active immediately. Admin approval may be required for visibility.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>List &quot;{project.name}&quot; for Sale</DialogTitle>
          <DialogDescription>
            Step {step} of 5: {
              step === 1 ? "Details & Pitch" :
              step === 2 ? "Verify Metrics" :
              step === 3 ? "Add Visuals" :
              step === 4 ? "Set Price" : "Review & Publish"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {renderStepContent()}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
           <Button variant="ghost" onClick={() => step > 1 ? setStep(step - 1) : onOpenChange(false)}>
             {step > 1 ? "Back" : "Cancel"}
           </Button>
           
           {step < 5 ? (
             <Button onClick={() => setStep(step + 1)} disabled={step === 1 && description.length < 10}>
               Next
             </Button>
           ) : (
             <Button 
               onClick={handleSubmit} 
               disabled={loading} 
               className="bg-green-600 hover:bg-green-700"
             >
               {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
               Publish Listing
             </Button>
           )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Icons
function MessageSquareIcon(props: any) {
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ZapIcon(props: any) {
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
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

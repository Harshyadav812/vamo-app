"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface BusinessPanelProps {
  project: Project;
  userId: string;
  activityCount: number;
  onProjectUpdate: (updates: Partial<Project>) => void;
  onPineappleEarned: (amount: number) => void;
}

type SidebarSection = "analysis" | "profile" | "activity" | "collaborators";

const SIDEBAR_ITEMS: { key: SidebarSection; label: string }[] = [
  { key: "analysis", label: "Analysis" },
  { key: "profile", label: "Profile" },
  { key: "activity", label: "Activity" },
  { key: "collaborators", label: "Collaborators" },
];

export function BusinessPanel({
  project,
  userId,
  activityCount,
  onProjectUpdate,
  onPineappleEarned,
}: BusinessPanelProps) {
  const [activeSection, setActiveSection] = useState<SidebarSection>("analysis");
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState(project.description ?? "");
  const [editingWhyBuilt, setEditingWhyBuilt] = useState(false);
  const [whyBuilt, setWhyBuilt] = useState(project.why_built ?? "");
  const [urlInput, setUrlInput] = useState(project.url ?? "");
  const [saving, setSaving] = useState(false);
  const [runningValuation, setRunningValuation] = useState(false);

  const supabase = createClient();

  async function saveField(
    field: string,
    value: string,
    eventType: string,
    rewardAmount: number
  ) {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({ [field]: value })
        .eq("id", project.id)
        .eq("owner_id", userId);

      if (error) throw error;

      onProjectUpdate({ [field]: value } as Partial<Project>);

      // Log activity and earn reward
      await supabase.from("activity_events").insert({
        project_id: project.id,
        user_id: userId,
        event_type: eventType,
        metadata: { field, value: value.substring(0, 100) },
      });

      // Award pineapples through the API
      const rewardRes = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          projectId: project.id,
          eventType,
          idempotencyKey: `${userId}:${project.id}:${eventType}:${field}`,
        }),
      });

      if (rewardRes.ok) {
        const rewardData = await rewardRes.json();
        if (rewardData.amount > 0) {
          onPineappleEarned(rewardData.amount);
          toast.success(`+${rewardData.amount} 🍍`, {
            description: `Earned for adding ${field.replace("_", " ")}!`,
          });
        }
      }
    } catch (err) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleRunValuation() {
    setRunningValuation(true);
    try {
      const res = await fetch("/api/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || "Failed");
      }

      const data = await res.json();
      toast.success("Valuation complete!", {
        description: `Estimated value: $${data.offer.low_range.toLocaleString()} - $${data.offer.high_range.toLocaleString()}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Valuation failed";
      toast.error(msg);
    } finally {
      setRunningValuation(false);
    }
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-48 shrink-0 border-r bg-gray-50 p-3">
        <div className="space-y-1">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveSection(item.key)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                activeSection === item.key
                  ? "bg-white font-medium shadow-sm"
                  : "text-gray-600 hover:bg-white/50"
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-green-400 shrink-0" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeSection === "analysis" && (
          <div className="space-y-8">
            {/* Project header */}
            <div>
              <h2 className="text-2xl font-bold">{project.name}</h2>

              {/* Action buttons row */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {!project.description && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingDescription(true)}
                  >
                    Add Description{" "}
                    <span className="ml-1 text-green-600">(+5🍍)</span>
                  </Button>
                )}
                <Button variant="outline" size="sm" disabled>
                  Add Industries{" "}
                  <span className="ml-1 text-green-600">(+5🍍)</span>
                </Button>
                {!project.url ? (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="https://your-project.com"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="h-8 w-56 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!urlInput || saving}
                      onClick={() =>
                        saveField("url", urlInput, "url_added", 10)
                      }
                    >
                      Add Project URL
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-green-600">
                    ✓ URL added
                  </span>
                )}
              </div>

              {/* Description editor */}
              {editingDescription && (
                <div className="mt-3 space-y-2">
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your project..."
                    rows={3}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={saving || !description.trim()}
                      onClick={() => {
                        saveField(
                          "description",
                          description,
                          "description_added",
                          5
                        );
                        setEditingDescription(false);
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingDescription(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {project.description && !editingDescription && (
                <p
                  className="mt-2 text-sm text-muted-foreground cursor-pointer hover:text-black"
                  onClick={() => setEditingDescription(true)}
                >
                  {project.description}
                </p>
              )}

              {/* Valuation button */}
              <div className="mt-4 flex items-center gap-2">
                {project.url ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRunValuation}
                    disabled={runningValuation}
                  >
                    {runningValuation
                      ? "Analyzing..."
                      : "Run Valuation Analysis 🍍"}
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    🍍 Unlock by adding Project URL
                  </span>
                )}
              </div>
            </div>

            <Separator />

            {/* Founder info */}
            <div className="text-sm text-muted-foreground">
              <span className="text-gray-400">○</span> Founder Name
            </div>

            <Separator />

            {/* Metrics row */}
            <div className="grid grid-cols-5 gap-4 text-center">
              {["Price", "Revenue", "Multiple", "Awards", "Charts"].map(
                (metric) => (
                  <div key={metric}>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {metric}
                    </p>
                    <p className="mt-1 text-lg font-bold text-gray-300">???</p>
                  </div>
                )
              )}
            </div>

            <Separator />

            {/* Evidence section */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">
                  Evidence ({activityCount})
                </h3>
                <Button variant="ghost" size="sm">
                  Add Evidence
                </Button>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed text-center text-sm text-muted-foreground">
                  Evidence
                  <br />
                  <span className="text-green-600">(+50🍍)</span>
                </div>
                <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed text-center text-sm text-muted-foreground">
                  Evidence
                  <br />
                  <span className="text-green-600">(+50🍍)</span>
                </div>
                <div className="flex h-24 items-center justify-center rounded-xl border-2 border-dashed text-center text-sm text-gray-300 cursor-pointer hover:border-gray-400 hover:text-gray-400 transition-colors">
                  +
                </div>
              </div>
            </div>

            <Separator />

            {/* Testimonials section */}
            <div>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Testimonials</h3>
                <Button variant="ghost" size="sm">
                  Add Testimonials
                </Button>
              </div>
              <div className="mt-3">
                <div className="flex h-16 items-center justify-center rounded-xl border-2 border-dashed text-center text-sm text-muted-foreground">
                  Testimonial{" "}
                  <span className="ml-1 text-green-600">(+10🍍)</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Why I Built This */}
            <div>
              <h3 className="font-semibold">Why I Built This</h3>
              {editingWhyBuilt ? (
                <div className="mt-2 space-y-2">
                  <Textarea
                    value={whyBuilt}
                    onChange={(e) => setWhyBuilt(e.target.value)}
                    placeholder="What's the story behind your project?"
                    rows={4}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={saving}
                      onClick={() => {
                        saveField(
                          "why_built",
                          whyBuilt,
                          "profile_updated",
                          5
                        );
                        setEditingWhyBuilt(false);
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingWhyBuilt(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p
                  className="mt-2 text-sm text-muted-foreground cursor-pointer hover:text-black"
                  onClick={() => setEditingWhyBuilt(true)}
                >
                  {project.why_built || "Click to add your story..."}
                </p>
              )}
            </div>
          </div>
        )}

        {activeSection === "profile" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Profile</h2>
            <p className="text-sm text-muted-foreground">
              Complete your profile to earn more pineapples.
            </p>
            <div className="rounded-xl border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
              Profile fields coming soon
              <br />
              <span className="text-green-600">(+100🍍 for completion)</span>
            </div>
          </div>
        )}

        {activeSection === "activity" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Activity</h2>
            <p className="text-sm text-muted-foreground">
              {activityCount} events logged for this project.
            </p>
            <div className="rounded-xl border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
              Activity timeline coming soon
            </div>
          </div>
        )}

        {activeSection === "collaborators" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Collaborators</h2>
            <p className="text-sm text-muted-foreground">
              Add collaborators to your project.
            </p>
            <div className="rounded-xl border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
              Collaborator management coming soon
              <br />
              <span className="text-green-600">(+100🍍 per collaborator)</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

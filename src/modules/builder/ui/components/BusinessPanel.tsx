"use client";

import { useState, useMemo, useEffect, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";
import type { Project, Message, ActivityEvent, Offer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { FullTimelineDialog } from "./FullTimelineDialog";
import { toast } from "sonner";
import {
  TrendingUp,
  DollarSign,
  Lightbulb,
  Rocket,
  ClipboardList,
  Link2,
  Globe,
  Github,
  Linkedin,
  Users,
  MessageSquare,
  FileText,
  Tag,
  BarChart3,
  Store,
  User,
  Pin,
  Trophy,
  Check,
  ExternalLink,
  Plus,
} from "lucide-react";

// ── Progress score weights ──────────────────────────────────────────────────
const SCORE_WEIGHTS: Record<string, number> = {
  description: 10,
  url: 10,
  why_built: 10,
  screenshot_url: 5,
};

function getStageLabel(score: number): string {
  if (score <= 25) return "Early Stage";
  if (score <= 50) return "Building";
  if (score <= 75) return "Traction";
  return "Growth";
}

function getStageColor(score: number): string {
  if (score <= 25) return "text-red-500";
  if (score <= 50) return "text-yellow-500";
  if (score <= 75) return "text-green-500";
  return "text-blue-500";
}

function getProgressBg(score: number): string {
  if (score <= 25) return "bg-red-500";
  if (score <= 50) return "bg-yellow-500";
  if (score <= 75) return "bg-green-500";
  return "bg-blue-500";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

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
};

const EVENT_ICONS: Record<string, ReactNode> = {
  chat_prompt: <MessageSquare className="h-3.5 w-3.5" />,
  url_added: <Link2 className="h-3.5 w-3.5" />,
  description_added: <FileText className="h-3.5 w-3.5" />,
  industry_added: <Tag className="h-3.5 w-3.5" />,
  collaborator_added: <Users className="h-3.5 w-3.5" />,
  evidence_added: <BarChart3 className="h-3.5 w-3.5" />,
  testimonial_added: <MessageSquare className="h-3.5 w-3.5" />,
  listing_created: <Store className="h-3.5 w-3.5" />,
  offer_received: <DollarSign className="h-3.5 w-3.5" />,
  profile_updated: <User className="h-3.5 w-3.5" />,
  feature_shipped: <Rocket className="h-3.5 w-3.5" />,
  customer_added: <Users className="h-3.5 w-3.5" />,
  revenue_logged: <DollarSign className="h-3.5 w-3.5" />,
};

interface BusinessPanelProps {
  project: Project;
  userId: string;
  messages: Message[];
  latestOffer: Offer | null;
  activityEvents: ActivityEvent[];
  onProjectUpdate: (updates: Partial<Project>) => void;
  onPineappleEarned: (amount: number) => void;
}

type SidebarSection = "analysis" | "collaborators";

export function BusinessPanel({
  project,
  userId,
  messages,
  latestOffer,
  activityEvents,
  onProjectUpdate,
  onPineappleEarned,
}: BusinessPanelProps) {
  const [activeSection, setActiveSection] = useState<SidebarSection>("analysis");
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState(project.description ?? "");
  const [editingWhyBuilt, setEditingWhyBuilt] = useState(false);
  const [whyBuilt, setWhyBuilt] = useState(project.why_built ?? "");
  const [urlInput, setUrlInput] = useState(project.url ?? "");
  const [githubInput, setGithubInput] = useState(project.github_url ?? "");
  const [linkedinInput, setLinkedinInput] = useState(project.linkedin_url ?? "");
  const [saving, setSaving] = useState(false);
  const [runningValuation, setRunningValuation] = useState(false);
  const [showFullTimeline, setShowFullTimeline] = useState(false);

  const supabase = createClient();

  const tractionEvents = useMemo(
    () => activityEvents
      .filter((e) => ["feature_shipped", "customer_added", "revenue_logged"].includes(e.event_type))
      .slice(0, 10),
    [activityEvents]
  );

  const progressScore = project.progress_score;

  async function saveField(field: string, value: string, eventType: string) {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({ [field]: value })
        .eq("id", project.id)
        .eq("owner_id", userId);

      if (error) throw error;

      const previousValue = project[field as keyof Project];
      onProjectUpdate({ [field]: value } as Partial<Project>);

      // Only log activity, reward, and progress on FIRST save (field was previously empty)
      if (!previousValue) {
        // Increment progress score additively
        const weight = SCORE_WEIGHTS[field] || 0;
        if (weight > 0) {
           const newScore = Math.min(100, project.progress_score + weight);
           await supabase
             .from("projects")
             .update({ progress_score: newScore })
             .eq("id", project.id);
           onProjectUpdate({ progress_score: newScore });
        }

        await supabase.from("activity_events").insert({
          project_id: project.id,
          user_id: userId,
          event_type: eventType,
          metadata: { field, value: value.substring(0, 100) },
        });

        if (eventType === "url_added") {
          let linkType = "website";
          if (field === "github_url") linkType = "github";
          if (field === "linkedin_url") linkType = "linkedin";
          trackEvent("link_added", { projectId: project.id, linkType });
        }

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
            toast.success(`+${rewardData.amount} pineapples`, {
              description: `Earned for adding ${field.replace("_", " ")}!`,
            });
          }
        }
      }

      toast.success("Saved!");
    } catch {
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
        description: `Estimated: $${data.offer.low_range.toLocaleString()} - $${data.offer.high_range.toLocaleString()}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Valuation failed";
      toast.error(msg);
    } finally {
      setRunningValuation(false);
    }
  }

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
      <div
        className="h-full bg-emerald-500 transition-all duration-500 ease-out"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

  return (
    <div className="flex h-full bg-white">
      {/* Sidebar */}
      <div className="w-44 shrink-0 border-r bg-gray-50/80 p-3">
        <div className="mb-4 space-y-1.5 px-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500">
              Progress
            </span>
            <span className="text-xs font-bold text-emerald-600">{progressScore}%</span>
          </div>
          <Progress value={progressScore} className="h-1.5" />
        </div>

        <div className="space-y-1">
          <button
            onClick={() => setActiveSection("analysis")}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              activeSection === "analysis"
                ? "bg-white font-medium shadow-sm"
                : "text-gray-600 hover:bg-white/50"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
            Analysis
          </button>
          <button
            onClick={() => setActiveSection("collaborators")}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
              activeSection === "collaborators"
                ? "bg-white font-medium shadow-sm"
                : "text-gray-600 hover:bg-white/50"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-blue-400 shrink-0" />
            Collaborators
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeSection === "analysis" && (
          <div className="space-y-6 max-w-2xl">
            {/* Project Header */}
            <div>
              <h2 className="text-2xl font-bold">{project.name}</h2>
              {editingDescription ? (
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
                        saveField("description", description, "description_added");
                        setEditingDescription(false);
                      }}
                    >
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingDescription(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : project.description ? (
                <p
                  className="mt-2 text-sm text-muted-foreground cursor-pointer hover:text-black transition-colors"
                  onClick={() => setEditingDescription(true)}
                >
                  {project.description}
                </p>
              ) : (
                <button
                  onClick={() => setEditingDescription(true)}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Plus className="inline h-3.5 w-3.5 mr-1" />Add description <span className="text-emerald-600 inline-flex items-center gap-0.5 ml-1">(+5 🍍)</span>
                </button>
              )}
            </div>

            {/* Progress Score */}
            <section className="rounded-xl border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className={`h-4 w-4 ${getStageColor(progressScore)}`} /> Progress Score</h3>
                <span className="text-lg font-bold">{progressScore}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div className={`h-full transition-all duration-500 ease-out ${getProgressBg(progressScore)}`} style={{ width: `${progressScore}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${getStageColor(progressScore)}`}>
                  {getStageLabel(progressScore)}
                </span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            </section>

            {/* Valuation Range */}
            <section className="rounded-xl border p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><DollarSign className="h-4 w-4 text-emerald-500" /> Valuation Range</h3>
              {latestOffer ? (
                <div className="rounded-lg bg-emerald-50 p-4 text-center">
                  <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">
                    Estimated Valuation
                  </p>
                  {latestOffer.low_range === 0 && latestOffer.high_range === 0 ? (
                    <div className="mt-2 inline-flex items-center rounded-md border border-emerald-200 bg-emerald-100/50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      Not yet estimated
                    </div>
                  ) : (
                    <p className="mt-1 text-2xl font-bold text-emerald-800">
                      ${latestOffer.low_range.toLocaleString()} &ndash; ${latestOffer.high_range.toLocaleString()}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Last updated {timeAgo(latestOffer.created_at)}
                  </p>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground mb-3">
                    Get an AI-powered estimate of your project&apos;s value
                  </p>
                  {project.url ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRunValuation}
                      disabled={runningValuation}
                    >
                      {runningValuation ? "Analyzing..." : <><span>Run Valuation Analysis</span><span className="ml-1.5 text-lg leading-none">🍍</span></>}
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      <Link2 className="inline h-3.5 w-3.5 mr-1" />Add a project URL to unlock valuation
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* Why I Built This */}
            <section className="rounded-xl border p-4 space-y-2">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Lightbulb className="h-4 w-4 text-amber-500" /> Why I Built This</h3>
              {editingWhyBuilt ? (
                <div className="space-y-2">
                  <Textarea
                    value={whyBuilt}
                    onChange={(e) => setWhyBuilt(e.target.value)}
                    placeholder="What's the story behind your project?"
                    rows={4}
                    className="text-sm"
                    maxLength={1000}
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {whyBuilt.length} / 1000
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        disabled={saving}
                        onClick={() => {
                          saveField("why_built", whyBuilt, "profile_updated");
                          setEditingWhyBuilt(false);
                        }}
                      >
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingWhyBuilt(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <p
                  className="text-sm text-muted-foreground cursor-pointer hover:text-black transition-colors"
                  onClick={() => setEditingWhyBuilt(true)}
                >
                  {project.why_built || "Click to add your motivation..."}
                </p>
              )}
            </section>

            {/* Traction Signals */}
            <section className="rounded-xl border p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Rocket className="h-4 w-4 text-blue-500" /> Traction Signals</h3>
              {tractionEvents.length > 0 ? (
                <div className="space-y-2">
                  {tractionEvents.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 rounded-lg bg-gray-50 p-2.5">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-white text-gray-600">
                        {EVENT_ICONS[event.event_type] || <Check className="h-3.5 w-3.5 text-emerald-600" />}
                      </div>
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{String(event.metadata.description || event.event_type)}</p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                          {timeAgo(event.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  Start logging progress in the chat to see traction signals here.
                </p>
              )}
            </section>

            {/* Activity Timeline */}
            <section className="rounded-xl border p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2"><ClipboardList className="h-4 w-4 text-gray-500" /> Activity Timeline</h3>
              {activityEvents.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-3.5 top-2 bottom-2 w-px bg-gray-200" />
                  <div className="space-y-3">
                    {activityEvents.slice(0, 10).map((event) => (
                      <div key={event.id} className="flex items-start gap-3 relative">
                        <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white border text-sm text-gray-600">
                          {EVENT_ICONS[event.event_type] || <Pin className="h-3.5 w-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-sm">{EVENT_LABELS[event.event_type] || event.event_type}</p>
                          <p className="text-xs text-muted-foreground">{timeAgo(event.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {activityEvents.length > 10 && (
                    <div className="pt-4 ml-10">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full sm:w-auto"
                        onClick={() => setShowFullTimeline(true)}
                      >
                        View All Activity ({activityEvents.length})
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  No activity recorded yet. Start building to see your timeline!
                </p>
              )}
            </section>

            {/* Linked Assets */}
            <section className="rounded-xl border p-4 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2"><Link2 className="h-4 w-4 text-gray-500" /> Linked Assets</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Website */}
                <div className="rounded-lg border p-3 text-center space-y-2">
                  <Globe className="h-5 w-5 text-gray-600 mx-auto" />
                  <p className="text-xs font-medium">Website</p>
                  {project.url ? (
                    <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center justify-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Visit
                    </a>
                  ) : (
                    <div className="flex gap-1">
                      <Input placeholder="https://..." value={urlInput} onChange={(e) => setUrlInput(e.target.value)} className="h-7 text-xs" />
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2 shrink-0" disabled={!urlInput || saving} onClick={() => saveField("url", urlInput, "url_added")}>
                        Add
                      </Button>
                    </div>
                  )}
                </div>

                {/* GitHub */}
                <div className="rounded-lg border p-3 text-center space-y-2">
                  <Github className="h-5 w-5 text-gray-600 mx-auto" />
                  <p className="text-xs font-medium">GitHub</p>
                  {project.github_url ? (
                    <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center justify-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Visit
                    </a>
                  ) : (
                    <div className="flex gap-1">
                      <Input placeholder="github.com/..." value={githubInput} onChange={(e) => setGithubInput(e.target.value)} className="h-7 text-xs" />
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2 shrink-0" disabled={!githubInput || saving} onClick={() => saveField("github_url", githubInput, "url_added")}>
                        Add
                      </Button>
                    </div>
                  )}
                </div>

                {/* LinkedIn */}
                <div className="rounded-lg border p-3 text-center space-y-2">
                  <Linkedin className="h-5 w-5 text-gray-600 mx-auto" />
                  <p className="text-xs font-medium">LinkedIn</p>
                  {project.linkedin_url ? (
                    <a href={project.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center justify-center gap-1">
                      <ExternalLink className="h-3 w-3" /> Visit
                    </a>
                  ) : (
                    <div className="flex gap-1">
                      <Input placeholder="linkedin.com/in/..." value={linkedinInput} onChange={(e) => setLinkedinInput(e.target.value)} className="h-7 text-xs" />
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2 shrink-0" disabled={!linkedinInput || saving} onClick={() => saveField("linkedin_url", linkedinInput, "url_added")}>
                        Add
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {activeSection === "collaborators" && (
          <div className="space-y-4 max-w-2xl">
            <h2 className="text-xl font-bold">Collaborators</h2>
            <p className="text-sm text-muted-foreground">Invite collaborators to your project to build together.</p>
            <div className="rounded-xl border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
              <Users className="h-6 w-6 text-gray-400 mx-auto mb-2" />
              <p className="font-medium">Collaborator management coming soon</p>
              <p className="mt-1 text-emerald-600 text-xs inline-flex items-center gap-0.5">(+10 🍍 per collaborator)</p>
            </div>
          </div>
        )}
      </div>

      {/* Full Timeline Modal */}
      <FullTimelineDialog
        open={showFullTimeline}
        onOpenChange={setShowFullTimeline}
        activityEvents={activityEvents}
      />
    </div>
  );
}

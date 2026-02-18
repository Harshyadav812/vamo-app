"use client";

import { useState, useMemo, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Project, Message, ActivityEvent, Offer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
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
  Cherry,
} from "lucide-react";

// ── Progress score weights ──────────────────────────────────────────────────
const SCORE_WEIGHTS: Record<string, number> = {
  description: 15,
  url: 20,
  why_built: 15,
  screenshot_url: 10,
};

function calculateProgressScore(project: Project): number {
  let score = 10;
  if (project.description) score += SCORE_WEIGHTS.description;
  if (project.url) score += SCORE_WEIGHTS.url;
  if (project.why_built) score += SCORE_WEIGHTS.why_built;
  if (project.screenshot_url) score += SCORE_WEIGHTS.screenshot_url;
  return Math.min(score, 100);
}

function getStageLabel(score: number): string {
  if (score <= 20) return "Getting Started";
  if (score <= 40) return "Early Stage";
  if (score <= 60) return "Building Momentum";
  if (score <= 80) return "Growth Phase";
  return "Mature";
}

function getStageColor(score: number): string {
  if (score <= 20) return "text-gray-500";
  if (score <= 40) return "text-orange-500";
  if (score <= 60) return "text-yellow-500";
  if (score <= 80) return "text-blue-500";
  return "text-emerald-500";
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

  const supabase = createClient();

  const milestoneMessages = useMemo(
    () => messages.filter((m) => m.tag === "milestone").slice(-5).reverse(),
    [messages]
  );

  const progressScore = calculateProgressScore(project);

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

      // Recalculate and persist progress score
      const updatedProject = { ...project, [field]: value };
      const newScore = calculateProgressScore(updatedProject);
      if (newScore !== project.progress_score) {
        await supabase
          .from("projects")
          .update({ progress_score: newScore })
          .eq("id", project.id);
        onProjectUpdate({ progress_score: newScore });
      }

      // Only log activity + reward on FIRST save (field was previously empty)
      if (!previousValue) {
        await supabase.from("activity_events").insert({
          project_id: project.id,
          user_id: userId,
          event_type: eventType,
          metadata: { field, value: value.substring(0, 100) },
        });

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
                  <Plus className="inline h-3.5 w-3.5 mr-1" />Add description <span className="text-emerald-600 inline-flex items-center gap-0.5 ml-1">(+5<Cherry className="inline h-3 w-3" />)</span>
                </button>
              )}
            </div>

            {/* Progress Score */}
            <section className="rounded-xl border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-500" /> Progress Score</h3>
                <span className="text-lg font-bold">{progressScore}</span>
              </div>
              <Progress value={progressScore} className="h-2" />
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
                  <p className="mt-1 text-2xl font-bold text-emerald-800">
                    ${latestOffer.low_range.toLocaleString()} &ndash; ${latestOffer.high_range.toLocaleString()}
                  </p>
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
                      {runningValuation ? "Analyzing..." : <><span>Run Valuation Analysis</span><Cherry className="ml-1.5 inline h-3.5 w-3.5" /></>}
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
                  />
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
              {milestoneMessages.length > 0 ? (
                <div className="space-y-2">
                  {milestoneMessages.map((msg) => (
                    <div key={msg.id} className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                      <Check className="mt-0.5 h-4 w-4 text-emerald-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2">{msg.content}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{timeAgo(msg.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  No milestones yet. Share achievements in chat with the{" "}
                  <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium">
                    <Trophy className="h-3 w-3" /> Milestone
                  </span>{" "}
                  tag to see traction signals here.
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
                    {activityEvents.map((event) => (
                      <div key={event.id} className="flex items-start gap-3 relative">
                        <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white border text-sm">
                          {EVENT_ICONS[event.event_type] || <Pin className="h-3.5 w-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-sm">{EVENT_LABELS[event.event_type] || event.event_type}</p>
                          <p className="text-xs text-muted-foreground">{timeAgo(event.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
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
              <p className="mt-1 text-emerald-600 text-xs inline-flex items-center gap-0.5">(+10<Cherry className="h-3 w-3" /> per collaborator)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

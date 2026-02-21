"use client";

import { useState, useRef, useEffect } from "react";
import type { Project, Message, MessageTag } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDistanceToNowStrict, differenceInHours, format } from "date-fns";
import { Sparkles, Bug, Wrench, Trophy, User, Zap, Users, Cherry } from "lucide-react";

interface ChatPanelProps {
  project: Project;
  messages: Message[];
  userId: string;
  onNewMessage: (message: Message) => void;
  onPineappleEarned: (amount: number) => void;
}

// ── Tag config ────────────────────────────────────────────────────────────────

const TAG_OPTIONS: { value: MessageTag; label: string; icon: React.ElementType }[] = [
  { value: "feature", label: "Feature", icon: Sparkles },
  { value: "bug", label: "Bug", icon: Bug },
  { value: "improvement", label: "Improve", icon: Wrench },
  { value: "milestone", label: "Milestone", icon: Trophy },
];

const TAG_STYLES: Record<
  MessageTag,
  { label: string; className: string }
> = {
  feature: {
    label: "Feature",
    className: "bg-violet-100 text-violet-800",
  },
  bug: {
    label: "Bug",
    className: "bg-red-100 text-red-800",
  },
  improvement: {
    label: "Improvement",
    className: "bg-blue-100 text-blue-800",
  },
  milestone: {
    label: "Milestone",
    className: "bg-amber-100 text-amber-800",
  },
  general: {
    label: "General",
    className: "bg-gray-100 text-gray-700",
  },
};

// ── Suggestion chips shown at the top when no messages yet ────────────────────

const SUGGESTION_CHIPS = [
  { label: "Add my Profile", reward: 100, icon: User },
  { label: "Log Vibecoding Activity", reward: 100, icon: Zap },
  { label: "Add Collaborators", reward: 100, icon: Users },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const hoursAgo = differenceInHours(new Date(), date);
  if (hoursAgo < 24) {
    return formatDistanceToNowStrict(date, { addSuffix: true });
  }
  return format(date, "MMM dd 'at' HH:mm");
}

// ── Typing Indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5 px-2 pb-4">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-[11px] font-bold text-white">
        V
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="inline-block size-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
          <span className="inline-block size-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
          <span className="inline-block size-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

// ── User Message ──────────────────────────────────────────────────────────────

function UserMessage({ msg }: { msg: Message }) {
  const tag = msg.tag && msg.tag !== "general" ? msg.tag : null;

  return (
    <div className="group flex flex-col items-end gap-1 pb-3 pl-10 pr-2">
      <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#2a2a2a] px-4 py-2.5 text-[13px] leading-relaxed text-white">
        {msg.content}
      </div>
      <div className="flex items-center gap-1.5">
        {/* Tag on User Message Removed per user request */}
        {/* {tag && (
          <Badge
            variant="outline"
            className={`h-5 border-0 px-1.5 text-[10px] font-medium ${TAG_STYLES[tag].className}`}
          >
            {TAG_STYLES[tag].label}
          </Badge>
        )} */}
        <span className="text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          {formatRelativeTime(msg.created_at)}
        </span>
      </div>
    </div>
  );
}

// ── Assistant Message ─────────────────────────────────────────────────────────

function AssistantMessage({ msg }: { msg: Message }) {
  return (
    <div className="group flex flex-col gap-1 pb-3 pr-10">
      {/* Avatar + name row */}
      <div className="flex items-center gap-2 pl-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-[11px] font-bold text-white">
          V
        </div>
        <span className="text-xs font-semibold text-gray-800">Vamo</span>
        <span className="text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          {formatRelativeTime(msg.created_at)}
        </span>
      </div>

      {/* Content */}
      <div className="pl-[38px]">
        <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-gray-900">
          {msg.content}
        </div>

        {/* Tags & Rewards row */}
        {(msg.tag || msg.pineapples_earned > 0) && (
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
             {/* Show tag if present (and it's a specific tag, not general) */}
             {msg.tag && msg.tag !== "general" && TAG_STYLES[msg.tag] && (
               <Badge
                 variant="outline"
                 className={`h-5 border-0 px-2 py-0 text-[10px] font-medium ${TAG_STYLES[msg.tag].className}`}
               >
                 {TAG_STYLES[msg.tag].label}
               </Badge>
             )}
            
            {/* Pineapple reward badge */}
            {msg.pineapples_earned > 0 && (
              <Badge
                variant="secondary"
                className="gap-1 px-2 py-0 h-5 text-[10px] font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100"
              >
                <span className="text-xs">🍍</span>
                <span>+{msg.pineapples_earned}</span>
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ChatPanel ────────────────────────────────────────────────────────────

export function ChatPanel({
  project,
  messages,
  userId,
  onNewMessage,
  onPineappleEarned,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedTag, setSelectedTag] = useState<MessageTag | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive (vibe pattern)
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  async function handleSend() {
    if (!input.trim() || sending) return;

    const userMessage = input.trim();
    const tag = selectedTag ?? "general";
    setInput("");
    setSelectedTag(null);
    setSending(true);

    // Optimistic: add user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      project_id: project.id,
      role: "user",
      content: userMessage,
      tag,
      summary: null,
      pineapples_earned: 0,
      created_at: new Date().toISOString(),
    };
    onNewMessage(tempUserMsg);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          message: userMessage,
          tag,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error?.message || "Failed to send message");
      }

      const data = await response.json();

      if (data.assistantMessage) {
        onNewMessage(data.assistantMessage);
      }

      if (data.pineapplesEarned && data.pineapplesEarned > 0) {
        onPineappleEarned(data.pineapplesEarned);
        toast.success(`+${data.pineapplesEarned} pineapples`, {
          description: "Pineapples earned for your activity!",
          icon: "🍍",
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Something went wrong";
      toast.error("Failed to send message", { description: errorMessage });
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSuggestionClick(label: string) {
    setInput(`I want to ${label.toLowerCase()}`);
    textareaRef.current?.focus();
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white">
      {/* Project name badge */}
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-2.5">
        <span className="text-xs font-medium text-muted-foreground">Chat</span>
        <span className="max-w-[180px] truncate rounded-md border border-gray-200 bg-white px-2.5 py-0.5 text-xs font-medium text-gray-600">
          {project.name}
        </span>
      </div>

      {/* Suggestion chips when no messages */}
      {messages.length === 0 && (
        <div className="space-y-3 p-4">
          <p className="text-[13px] leading-relaxed text-gray-600 flex flex-wrap items-center gap-1">
            Welcome! Go to{" "}
            <span className="font-medium text-black underline">
              Business Analysis
            </span>{" "}
            to earn pineapples, or start chatting below. <span className="text-lg leading-none">🍍</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => handleSuggestionClick(chip.label)}
                className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-all hover:border-gray-300 hover:shadow-sm"
              >
                <chip.icon className="h-3.5 w-3.5 text-gray-500" />
                <span>{chip.label}</span>
                <span className="text-emerald-600 flex items-center gap-0.5">
                  +{chip.reward}<span className="text-xs">🍍</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages — scrollable area (vibe pattern: flex-1 min-h-0 overflow-y-auto) */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-1 py-3 px-2">
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === "user" ? (
                <UserMessage msg={msg} />
              ) : (
                <AssistantMessage msg={msg} />
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {sending && <TypingIndicator />}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area — pinned at bottom */}
      <div className="relative shrink-0 border-t px-3 py-3">
        {/* Fade gradient above input */}
        <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-white pointer-events-none" />
        {/* Tag selector row */}
        <div className="mb-2 flex items-center gap-1">
          {TAG_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() =>
                setSelectedTag((prev) =>
                  prev === opt.value ? null : opt.value
                )
              }
              className={`rounded-full px-2.5 py-1 text-[10px] font-medium transition-all flex items-center gap-1.5 ${
                selectedTag === opt.value
                  ? TAG_STYLES[opt.value].className + " ring-1 ring-offset-1"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <opt.icon className="h-3 w-3" /> {opt.label}
            </button>
          ))}
        </div>

        {/* Textarea + send */}
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share an update on your project…"
            className="min-h-[40px] max-h-[120px] resize-none rounded-xl border-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-gray-300"
            rows={1}
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="shrink-0 rounded-xl bg-black text-white hover:bg-gray-800"
          >
            {sending ? "…" : "↑"}
          </Button>
        </div>

        {/* Keyboard shortcut hint */}
        <p className="mt-1 text-[10px] text-muted-foreground">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

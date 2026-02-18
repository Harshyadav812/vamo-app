"use client";

import { useState, useRef, useEffect } from "react";
import type { Project, Message, MessageTag } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface ChatPanelProps {
  project: Project;
  messages: Message[];
  userId: string;
  onNewMessage: (message: Message) => void;
  onPineappleEarned: (amount: number) => void;
}

// Suggestion chips shown at bottom
const SUGGESTION_CHIPS = [
  { label: "Profile", reward: 100 },
  { label: "Vibecoding Activity", reward: 100 },
  { label: "Collaborators", reward: 100 },
];

export function ChatPanel({
  project,
  messages,
  userId,
  onNewMessage,
  onPineappleEarned,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
    setInput("");
    setSending(true);

    // Optimistic: add user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      project_id: project.id,
      role: "user",
      content: userMessage,
      tag: "general",
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
          tag: "general",
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
        toast.success(`+${data.pineapplesEarned} 🍍`, {
          description: "Pineapples earned for your activity!",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
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

  function handleSuggestionClick(suggestion: string) {
    setInput(`I want to add my ${suggestion.toLowerCase()}`);
    textareaRef.current?.focus();
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Project source badge - top right */}
      <div className="flex items-center justify-end border-b px-4 py-2.5">
        <span className="rounded-md border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600">
          {project.name}
        </span>
      </div>

      {/* Intro message when no messages */}
      {messages.length === 0 && (
        <div className="px-4 py-4 text-[13px] leading-relaxed text-gray-600">
          Go to{" "}
          <span className="font-medium text-black underline cursor-pointer">
            Business Analysis
          </span>{" "}
          to earn pineapples. You can add any of the fields to redeem
          pineapples 🍍
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="space-y-5 py-4">
          {/* Show intro text before first messages */}
          {messages.length > 0 && (
            <div className="text-[13px] leading-relaxed text-gray-600">
              Go to{" "}
              <span className="font-medium text-black underline cursor-pointer">
                Business Analysis
              </span>{" "}
              to earn pineapples. You can add any of the fields to redeem
              pineapples 🍍
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === "user" ? (
                /* User message: right-aligned, dark bubble */
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl bg-[#2a2a2a] px-4 py-3 text-[13px] leading-relaxed text-white">
                    {msg.content}
                  </div>
                </div>
              ) : (
                /* Assistant message: left-aligned, plain text */
                <div className="max-w-[90%]">
                  <div className="text-[13px] leading-relaxed text-gray-900 whitespace-pre-wrap">
                    {msg.content}
                  </div>
                  {/* Pineapple reward indicator */}
                  {msg.pineapples_earned > 0 && (
                    <span className="mt-1 inline-block text-xs font-semibold text-gray-900">
                      (+{msg.pineapples_earned} 🍍)
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {sending && (
            <div className="flex items-center gap-2">
              <svg
                className="h-6 w-6 animate-spin text-teal-500"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="31.4 31.4"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-2 px-4 pb-3">
        {SUGGESTION_CHIPS.map((chip) => (
          <button
            key={chip.label}
            onClick={() => handleSuggestionClick(chip.label)}
            className="rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {chip.label}{" "}
            <span className="text-gray-700">
              +{chip.reward}🍍
            </span>
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="border-t px-3 py-3">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[40px] max-h-[120px] resize-none rounded-xl border-gray-200 text-sm focus-visible:ring-1 focus-visible:ring-gray-300"
            rows={1}
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="shrink-0 rounded-xl bg-black text-white hover:bg-gray-800"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

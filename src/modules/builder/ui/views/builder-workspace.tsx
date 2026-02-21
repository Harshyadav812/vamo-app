"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Project, Profile, Message, ActivityEvent, Offer } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { ChatPanel } from "@/modules/builder/ui/components/ChatPanel";
import { UIPreview } from "@/modules/builder/ui/components/UIPreview";
import { BusinessPanel } from "@/modules/builder/ui/components/BusinessPanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ListForSaleDialog } from "@/modules/builder/ui/components/ListForSaleDialog";
import { OfferDialog } from "@/modules/builder/ui/components/OfferDialog";
import { useMediaQuery } from "@/hooks/use-media-query";
import { MessageSquare } from "lucide-react";

interface BuilderWorkspaceProps {
  project: Project;
  profile: Profile;
  initialMessages: Message[];
  latestOffer: Offer | null;
  activityEvents: ActivityEvent[];
  userId: string;
}

export function BuilderWorkspace({
  project,
  profile,
  initialMessages,
  latestOffer,
  activityEvents,
  userId,
}: BuilderWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"project" | "business">("project");
  const [pineappleBalance, setPineappleBalance] = useState(profile.pineapple_balance);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [localActivityEvents, setLocalActivityEvents] = useState<ActivityEvent[]>(activityEvents);
  const [currentProject, setCurrentProject] = useState<Project>(project);
  const [showListDialog, setShowListDialog] = useState(false);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1279px)");

  // Sync props to local state if server re-fetches
  useEffect(() => {
    setCurrentProject(project);
  }, [project]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    setIsMounted(true);

    const channel = supabase
      .channel('workspace-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'projects', filter: `id=eq.${project.id}` },
        (payload) => {
          setCurrentProject((prev) => ({ ...prev, ...payload.new }));
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_events', filter: `project_id=eq.${project.id}` },
        (payload) => {
          setLocalActivityEvents((prev) => [payload.new as ActivityEvent, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          if (payload.new.pineapple_balance !== undefined) {
             setPineappleBalance(payload.new.pineapple_balance);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project.id, userId, supabase]);

  function handlePineappleEarned(amount: number) {
    setPineappleBalance((prev) => prev + amount);
  }

  function handleNewMessage(message: Message) {
    setMessages((prev) => [...prev, message]);
  }

  const handleProjectUpdate = useCallback((updates: Partial<Project>) => {
    setCurrentProject((prev) => {
      const updated = { ...prev, ...updates };
      // Force a new object reference even if deep equality is same, to trigger effects
      return { ...updated };
    });
    // Also update the server-side/global cache if needed, but local state drives UI
  }, []);

  // Shared header content
  const logo = (
    <div className="flex items-center gap-3">
      <Link
        href="/projects"
        className="text-lg font-extrabold italic tracking-tight"
      >
        &gt;&gt;&gt; vamo
      </Link>
      <div className="flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-sm font-semibold text-orange-700">
        {pineappleBalance} <span className="text-lg leading-none">🍍</span>
      </div>
    </div>
  );

  const actionButtons = (
    <div className="flex items-center gap-2">
      {currentProject.progress_score >= 10 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowOfferDialog(true)}
        >
          Get Vamo Offer
        </Button>
      )}
      {currentProject.progress_score >= 20 && (
        <Button
          size="sm"
          className="rounded-full bg-green-600 px-4 text-white hover:bg-green-700"
          onClick={() => setShowListDialog(true)}
        >
          List for Sale
        </Button>
      )}
    </div>
  );

  const tabToggle = (
    <div className="flex items-center rounded-full border border-gray-200 bg-white p-0.5">
      <button
        onClick={() => setActiveTab("project")}
        className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
          activeTab === "project"
            ? "bg-gray-100 text-black"
            : "text-gray-400 hover:text-black"
        }`}
      >
        Project
      </button>
      <button
        onClick={() => setActiveTab("business")}
        className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
          activeTab === "business"
            ? "bg-gray-100 text-black"
            : "text-gray-400 hover:text-black"
        }`}
      >
        Business
      </button>
    </div>
  );

  const chatContent = (
    <ChatPanel
      project={currentProject}
      messages={messages}
      userId={userId}
      onNewMessage={handleNewMessage}
      onPineappleEarned={handlePineappleEarned}
      onProjectUpdate={handleProjectUpdate}
    />
  );

  const rightPanelContent = (
    <div className="flex-1 min-h-0 overflow-auto">
      {activeTab === "project" ? (
        <UIPreview project={currentProject} />
      ) : (
        <BusinessPanel
          project={currentProject}
          userId={userId}
          messages={messages}
          latestOffer={latestOffer}
          activityEvents={localActivityEvents}
          onProjectUpdate={handleProjectUpdate}
          onPineappleEarned={handlePineappleEarned}
        />
      )}
    </div>
  );

  // SSR guard — render a skeleton until hydrated so media queries are accurate
  if (!isMounted) {
    return (
      <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden bg-white">
        {/* Left/Sidebar Skeleton */}
        <div className="w-full md:w-[30%] flex-col border-r flex">
          <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
            <Skeleton className="h-6 w-24" />
          </header>
          <div className="flex-1 p-4 space-y-4">
            <Skeleton className="h-12 w-3/4 rounded-2xl rounded-tl-sm self-start ml-8" />
            <Skeleton className="h-16 w-5/6 rounded-2xl rounded-tr-sm self-end" />
            <Skeleton className="h-10 w-2/3 rounded-2xl rounded-tl-sm self-start ml-8" />
          </div>
          <div className="h-16 border-t p-3">
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
        
        {/* Right/Main panel Skeleton */}
        <div className="w-full md:w-[70%] flex flex-col">
          <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-24" />
            </div>
          </header>
          <div className="flex-1 p-6 space-y-6">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Mobile Layout (<768px): Full-screen tabs ──────────────────────────────

  if (!isDesktop && !isTablet) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          {logo}
          {actionButtons}
        </header>

        {/* Tabbed content */}
        <Tabs defaultValue="chat" className="flex flex-1 flex-col min-h-0">
          <div className="border-b px-4 py-2 shrink-0">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 relative">
            <TabsContent
              value="chat"
              className="absolute inset-0 mt-0 border-0 p-0 data-[state=active]:flex flex-col"
            >
              {chatContent}
            </TabsContent>
            <TabsContent
              value="preview"
              className="absolute inset-0 mt-0 border-0 p-0 data-[state=active]:flex flex-col"
            >
              <UIPreview project={currentProject} />
            </TabsContent>
            <TabsContent
              value="business"
              className="absolute inset-0 mt-0 border-0 p-0 data-[state=active]:flex flex-col overflow-hidden"
            >
              <BusinessPanel
                project={currentProject}
                userId={userId}
                messages={messages}
                latestOffer={latestOffer}
                activityEvents={activityEvents}
                onProjectUpdate={handleProjectUpdate}
                onPineappleEarned={handlePineappleEarned}
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* Dialogs */}
        <ListForSaleDialog
          open={showListDialog}
          onOpenChange={setShowListDialog}
          project={currentProject}
          userId={userId}
          activityEvents={activityEvents}
        />
        <OfferDialog
          open={showOfferDialog}
          onOpenChange={setShowOfferDialog}
          project={currentProject}
          userId={userId}
          onAcceptOffer={() => setShowListDialog(true)}
        />
      </div>
    );
  }

  // ── Tablet Layout (768-1279px): 2-panel with chat in Sheet drawer ─────────

  if (isTablet) {
    return (
      <div className="flex h-dvh flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            {logo}
            {/* Chat Sheet trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" /> Chat
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[380px] p-0">
                {chatContent}
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center gap-3">
            {tabToggle}
            {actionButtons}
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 min-h-0">
          {rightPanelContent}
        </div>

        {/* Dialogs */}
        <ListForSaleDialog
          open={showListDialog}
          onOpenChange={setShowListDialog}
          project={currentProject}
          userId={userId}
          activityEvents={activityEvents}
        />
        <OfferDialog
          open={showOfferDialog}
          onOpenChange={setShowOfferDialog}
          project={currentProject}
          userId={userId}
          onAcceptOffer={() => setShowListDialog(true)}
        />
      </div>
    );
  }

  // ── Desktop Layout (≥1280px): Resizable 2-panel ───────────────────────────

  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        {/* Left Panel: Chat */}
        <ResizablePanel
          id="chat-panel"
          defaultSize={30}
          minSize={20}
          maxSize={45}
          className="flex flex-col min-h-0"
        >
          {/* Left header */}
          <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
            {logo}
          </header>
          {chatContent}
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel: Project/Business */}
        <ResizablePanel id="main-panel" defaultSize={70} minSize={40}>
          <div className="flex flex-col h-full">
            {/* Right header */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b px-4">
              {tabToggle}
              {actionButtons}
            </div>
            {rightPanelContent}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Dialogs */}
      <ListForSaleDialog
        open={showListDialog}
        onOpenChange={setShowListDialog}
        project={currentProject}
        userId={userId}
        activityEvents={activityEvents}
      />
      <OfferDialog
        open={showOfferDialog}
        onOpenChange={setShowOfferDialog}
        project={currentProject}
        userId={userId}
        onAcceptOffer={() => setShowListDialog(true)}
      />
    </div>
  );
}

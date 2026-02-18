"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Project, Profile, Message } from "@/lib/types";
import { ChatPanel } from "@/modules/builder/ui/components/ChatPanel";
import { UIPreview } from "@/modules/builder/ui/components/UIPreview";
import { BusinessPanel } from "@/modules/builder/ui/components/BusinessPanel";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ListForSaleDialog } from "@/modules/builder/ui/components/ListForSaleDialog";
import { OfferDialog } from "@/modules/builder/ui/components/OfferDialog";
import { useMediaQuery } from "@/hooks/use-media-query";

interface BuilderWorkspaceProps {
  project: Project;
  profile: Profile;
  initialMessages: Message[];
  activityCount: number;
  userId: string;
}

export function BuilderWorkspace({
  project,
  profile,
  initialMessages,
  activityCount,
  userId,
}: BuilderWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"project" | "business">("project");
  const [pineappleBalance, setPineappleBalance] = useState(profile.pineapple_balance);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [currentProject, setCurrentProject] = useState<Project>(project);
  const [showListDialog, setShowListDialog] = useState(false);
  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1279px)");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  function handlePineappleEarned(amount: number) {
    setPineappleBalance((prev) => prev + amount);
  }

  function handleNewMessage(message: Message) {
    setMessages((prev) => [...prev, message]);
  }

  function handleProjectUpdate(updates: Partial<Project>) {
    setCurrentProject((prev) => ({ ...prev, ...updates }));
  }

  // Shared header content
  const logo = (
    <div className="flex items-center gap-3">
      <Link
        href="/projects"
        className="text-lg font-extrabold tracking-tight"
      >
        &gt;&gt;&gt; vamo
      </Link>
      <div className="flex items-center gap-1 rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-sm font-semibold text-orange-700">
        {pineappleBalance} 🍍
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
          activityCount={activityCount}
          onProjectUpdate={handleProjectUpdate}
          onPineappleEarned={handlePineappleEarned}
        />
      )}
    </div>
  );

  // SSR guard — render nothing until hydrated so media queries are accurate
  if (!isMounted) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-lg text-muted-foreground">Loading builder…</div>
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
                activityCount={activityCount}
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
        />
        <OfferDialog
          open={showOfferDialog}
          onOpenChange={setShowOfferDialog}
          project={currentProject}
          userId={userId}
          activityCount={activityCount}
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
                  💬 Chat
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
        />
        <OfferDialog
          open={showOfferDialog}
          onOpenChange={setShowOfferDialog}
          project={currentProject}
          userId={userId}
          activityCount={activityCount}
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
      />
      <OfferDialog
        open={showOfferDialog}
        onOpenChange={setShowOfferDialog}
        project={currentProject}
        userId={userId}
        activityCount={activityCount}
      />
    </div>
  );
}

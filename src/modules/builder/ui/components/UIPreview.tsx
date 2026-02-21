"use client";

import { useState, useEffect } from "react";
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Monitor, Tablet, Smartphone, ExternalLink, RefreshCw, AlertCircle } from "lucide-react";

interface UIPreviewProps {
  project: Project;
}

export function UIPreview({ project }: UIPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [canEmbed, setCanEmbed] = useState<boolean | null>(null);
  const [deviceMap] = useState({
    desktop: "w-full",
    tablet: "w-[768px]",
    mobile: "w-[375px]",
  });
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  useEffect(() => {
    async function checkEmbeddability() {
      if (!project.url) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/preview?url=${encodeURIComponent(project.url)}`);
        if (res.ok) {
          const data = await res.json();
          setCanEmbed(data.canEmbed);
        } else {
          setCanEmbed(false);
        }
      } catch (err) {
        setCanEmbed(false);
      } finally {
        setLoading(false);
      }
    }

    checkEmbeddability();
  }, [project.url]);

  function handleRefresh() {
    setLoading(true);
    setIframeKey((prev) => prev + 1);
  }

  function handleOpenInNewTab() {
    if (project.url) {
      window.open(project.url, "_blank", "noopener,noreferrer");
    }
  }

  // No URL — show empty state
  if (!project.url) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-gray-50 text-center">
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12">
          <p className="text-lg font-medium text-gray-600">No Project URL</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Link a project URL to see a live preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gray-50/50">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700 truncate max-w-[250px] sm:max-w-xs">
            {project.url}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center rounded-md border bg-muted/50 p-0.5">
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 ${device === "desktop" ? "bg-white shadow-sm" : ""}`}
              onClick={() => setDevice("desktop")}
            >
              <Monitor className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 ${device === "tablet" ? "bg-white shadow-sm" : ""}`}
              onClick={() => setDevice("tablet")}
            >
              <Tablet className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 ${device === "mobile" ? "bg-white shadow-sm" : ""}`}
              onClick={() => setDevice("mobile")}
            >
              <Smartphone className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 px-2.5" onClick={handleRefresh}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
            </Button>
            <Button variant="default" size="sm" className="h-8 px-2.5" onClick={handleOpenInNewTab}>
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 bg-gray-100 flex justify-center py-4 overflow-auto">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50/80 backdrop-blur-sm">
            <div className="space-y-4 w-full max-w-md p-8 bg-white rounded-xl shadow-sm border">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        )}
        
        {!loading && canEmbed === false ? (
          <div className="flex items-center justify-center w-full h-full p-6">
             {project.screenshot_url ? (
               <div className="max-w-4xl w-full rounded-lg overflow-hidden border shadow-sm bg-white">
                 <img src={project.screenshot_url} alt="Project Screenshot" className="w-full h-auto object-cover" />
                 <div className="p-4 bg-amber-50 border-t flex items-center gap-2 text-sm text-amber-800">
                    <AlertCircle className="h-4 w-4" />
                    <span>Live preview unavailable due to site security settings. Showing latest screenshot instead.</span>
                 </div>
               </div>
             ) : (
                <div className="text-center space-y-3 bg-white p-8 rounded-xl border shadow-sm max-w-md">
                  <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-2">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold">Preview Unavailable</h3>
                  <p className="text-sm text-muted-foreground px-4">
                    This website doesn&apos;t allow embedding inside other apps.
                  </p>
                  <Button variant="default" onClick={handleOpenInNewTab} className="mt-4">
                    Open in new tab <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                </div>
             )}
          </div>
        ) : (
          <div className={`h-full transition-all duration-300 ease-in-out bg-white border shadow-sm rounded-md overflow-hidden ${deviceMap[device]}`}>
            <iframe
              key={iframeKey}
              src={project.url}
              className="h-full w-full border-0 bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              onLoad={() => setLoading(false)}
              title={`Preview of ${project.name}`}
            />
          </div>
        )}
      </div>
    </div>
  );
}

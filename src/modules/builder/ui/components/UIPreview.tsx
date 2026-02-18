"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface UIPreviewProps {
  project: Project;
}

export function UIPreview({ project }: UIPreviewProps) {
  const [loading, setLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);

  function handleRefresh() {
    setLoading(true);
    setIframeKey((prev) => prev + 1);
  }

  function handleOpenInNewTab() {
    if (project.url) {
      window.open(project.url, "_blank", "noopener,noreferrer");
    }
  }

  // No URL — show placeholder
  if (!project.url) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-gray-50 text-center">
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12">
          <p className="text-lg font-medium text-gray-600">No Project URL</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a project URL from the Business Analysis tab
            <br />
            to see your project preview here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground truncate max-w-[300px]">
            {project.url}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={handleRefresh}>
            ↻ Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={handleOpenInNewTab}>
            ↗ Open
          </Button>
        </div>
      </div>

      {/* iframe */}
      <div className="relative flex-1">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50">
            <div className="space-y-4 w-full max-w-md p-8">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        )}
        <iframe
          key={iframeKey}
          src={project.url}
          className="h-full w-full"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          onLoad={() => setLoading(false)}
          title={`Preview of ${project.name}`}
        />
      </div>
    </div>
  );
}

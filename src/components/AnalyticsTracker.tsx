"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname) {
      // Build full url for tracking if search params exist, otherwise just pathname
      const url = searchParams?.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
      
      trackEvent("page_view", { path: url });
    }
  }, [pathname, searchParams]);

  return null;
}

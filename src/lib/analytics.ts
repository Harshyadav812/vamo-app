import { createClient } from "@/lib/supabase/client";

/**
 * Track an analytics event — fire-and-forget from client components
 */
export function trackEvent(
  eventName: string,
  properties: Record<string, unknown> = {}
): void {
  // Fire and forget — don't block UI
  const supabase = createClient();

  supabase
    .from("analytics_events")
    .insert({
      event_name: eventName,
      properties,
    })
    .then(({ error }) => {
      if (error) {
        console.error("[analytics] Failed to track event:", error.message);
      }
    });
}

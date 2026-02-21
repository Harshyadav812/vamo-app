import { createClient } from "@/lib/supabase/client";

export type AnalyticsEventName = 
  | "project_created"
  | "prompt_sent"
  | "reward_earned"
  | "reward_redeemed"
  | "listing_created"
  | "offer_requested"
  | "link_added"
  | "page_view";

export async function trackEvent(eventName: AnalyticsEventName, properties: Record<string, any> = {}) {
  try {
    const supabase = createClient();
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Only track signed-in users

    // The RLS policy requires auth.uid() = user_id
    const { error } = await supabase
      .from("analytics_events")
      .insert({
        user_id: user.id,
        event_name: eventName,
        properties: properties,
      });

    if (error) {
      console.error("[Analytics] Error tracking event:", error);
    } else {
      console.log(`[Analytics] Tracked ${eventName}`, properties);
    }
  } catch (err) {
    console.error("[Analytics] Unexpected error:", err);
  }
}

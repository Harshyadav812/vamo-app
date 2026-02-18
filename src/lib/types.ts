// Database types matching Supabase schema

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  pineapple_balance: number;
  is_admin: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  url: string | null;
  screenshot_url: string | null;
  why_built: string | null;
  progress_score: number;
  listed: boolean;
  created_at: string;
  updated_at: string;
}

export type MessageRole = "user" | "assistant";
export type MessageTag = "feature" | "bug" | "improvement" | "milestone" | "general";

export interface Message {
  id: string;
  project_id: string;
  role: MessageRole;
  content: string;
  tag: MessageTag | null;
  pineapples_earned: number;
  created_at: string;
}

export type ActivityEventType =
  | "chat_prompt"
  | "url_added"
  | "description_added"
  | "industry_added"
  | "collaborator_added"
  | "evidence_added"
  | "testimonial_added"
  | "listing_created"
  | "offer_received"
  | "profile_updated";

export interface ActivityEvent {
  id: string;
  project_id: string;
  user_id: string;
  event_type: ActivityEventType;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface RewardLedgerEntry {
  id: string;
  user_id: string;
  project_id: string | null;
  event_type: string;
  amount: number;
  idempotency_key: string;
  created_at: string;
}

export type RedemptionStatus = "pending" | "fulfilled" | "failed";

export interface Redemption {
  id: string;
  user_id: string;
  amount: number;
  status: RedemptionStatus;
  created_at: string;
  fulfilled_at: string | null;
}

export interface Listing {
  id: string;
  project_id: string;
  owner_id: string;
  title: string;
  description: string;
  asking_price: number | null;
  status: "active" | "sold" | "withdrawn";
  created_at: string;
}

export interface Offer {
  id: string;
  project_id: string;
  user_id: string;
  low_range: number;
  high_range: number;
  reasoning: string;
  signals: Record<string, unknown>;
  expired: boolean;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_name: string;
  properties: Record<string, unknown>;
  created_at: string;
}

// API error shape — consistent across all routes
export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

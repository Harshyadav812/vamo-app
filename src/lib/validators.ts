import { z } from "zod/v4";

// ─── Project ────────────────────────────────────────────────────────────────
export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().max(500).optional(),
  url: z.url("Must be a valid URL").optional(),
  why_built: z.string().max(1000).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// ─── Chat ───────────────────────────────────────────────────────────────────
export const chatMessageSchema = z.object({
  projectId: z.uuid("Invalid project ID"),
  message: z.string().min(1, "Message cannot be empty").max(5000),
  tag: z.enum(["feature", "bug", "improvement", "milestone", "general"]).optional(),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

// ─── Rewards ────────────────────────────────────────────────────────────────
export const rewardSchema = z.object({
  userId: z.uuid(),
  projectId: z.uuid(),
  eventType: z.string().min(1),
  idempotencyKey: z.string().min(1),
});

export type RewardInput = z.infer<typeof rewardSchema>;

// ─── Redeem ─────────────────────────────────────────────────────────────────
export const redeemSchema = z.object({
  amount: z.number().int().min(50, "Minimum redemption is 50 pineapples"),
});

export type RedeemInput = z.infer<typeof redeemSchema>;

// ─── Offer ──────────────────────────────────────────────────────────────────
export const offerSchema = z.object({
  projectId: z.uuid("Invalid project ID"),
});

export type OfferInput = z.infer<typeof offerSchema>;

// ─── Listing ────────────────────────────────────────────────────────────────
export const createListingSchema = z.object({
  projectId: z.uuid("Invalid project ID"),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  askingPrice: z.number().positive().optional(),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;

// ─── Profile Update ─────────────────────────────────────────────────────────
export const updateProfileSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  avatar_url: z.url().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

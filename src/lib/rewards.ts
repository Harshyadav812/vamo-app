// Reward amounts by event type
export const REWARD_AMOUNTS: Record<string, number> = {
  chat_prompt: 5,
  url_added: 10,
  description_added: 5,
  industry_added: 5,
  collaborator_added: 10,
  evidence_added: 50,
  testimonial_added: 10,
  profile_updated: 100,
  vibecoding_activity: 100,
  listing_created: 20,
};

// Rate limiting: max rewards per hour
export const MAX_REWARDS_PER_HOUR = 60;

/**
 * Generate an idempotency key for a reward event
 * Prevents duplicate rewards for the same action
 */
export function generateIdempotencyKey(
  userId: string,
  projectId: string,
  eventType: string,
  identifier?: string
): string {
  const base = `${userId}:${projectId}:${eventType}`;
  if (identifier) {
    return `${base}:${identifier}`;
  }
  return `${base}:${Date.now()}`;
}

/**
 * Get the reward amount for a given event type
 */
export function getRewardAmount(eventType: string): number {
  return REWARD_AMOUNTS[eventType] ?? 0;
}

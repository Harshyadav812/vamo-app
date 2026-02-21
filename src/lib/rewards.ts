// Reward amounts by event type
export const REWARD_AMOUNTS: Record<string, number> = {
  chat_prompt: 1,
  chat_feature: 1,
  chat_customer: 1,
  chat_revenue: 1,
  link_linkedin: 5,
  link_github: 5,
  link_website: 3,
  feature_shipped: 3,
  customer_added: 5,
  revenue_logged: 10,
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

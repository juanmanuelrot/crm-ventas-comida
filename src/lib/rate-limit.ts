type Bucket = {
  tokens: number;
  lastRefill: number;
};

const buckets = new Map<string, Bucket>();

const CAPACITY = 5;
const REFILL_INTERVAL_MS = 5 * 60 * 1000;
const REFILL_AMOUNT = CAPACITY;

export type RateLimitResult = { ok: true } | { ok: false; retryAfterMs: number };

export function checkRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: CAPACITY, lastRefill: now };
    buckets.set(key, bucket);
  }

  const elapsed = now - bucket.lastRefill;
  if (elapsed >= REFILL_INTERVAL_MS) {
    bucket.tokens = REFILL_AMOUNT;
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) {
    return { ok: false, retryAfterMs: REFILL_INTERVAL_MS - elapsed };
  }

  bucket.tokens -= 1;
  return { ok: true };
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

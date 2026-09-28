/**
 * High-performance sliding window rate limiter for Vercel Serverless
 * Prevents attendance verification stampedes and brute-force replay attacks.
 */

interface RateLimitRecord {
  timestamps: number[];
}

class SlidingWindowRateLimiter {
  private storage = new Map<string, RateLimitRecord>();
  private lastCleanup = Date.now();

  /**
   * Check if an action is allowed within the sliding window
   * @param key Identifier (e.g. `ip:1.2.3.4` or `student:std_123`)
   * @param limit Max allowed requests within window
   * @param windowMs Window duration in milliseconds (default: 60,000ms = 1 min)
   */
  public check(
    key: string,
    limit: number,
    windowMs = 60000
  ): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    this.periodicCleanup(now, windowMs);

    let record = this.storage.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.storage.set(key, record);
    }

    // Filter out timestamps outside the active window
    const windowStart = now - windowMs;
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= limit) {
      const oldestTimestamp = record.timestamps[0];
      const resetMs = Math.max(0, oldestTimestamp + windowMs - now);
      return {
        allowed: false,
        remaining: 0,
        resetMs,
      };
    }

    record.timestamps.push(now);
    return {
      allowed: true,
      remaining: limit - record.timestamps.length,
      resetMs: windowMs,
    };
  }

  private periodicCleanup(now: number, windowMs: number) {
    if (now - this.lastCleanup > 30000) {
      const threshold = now - windowMs * 2;
      for (const [k, v] of this.storage.entries()) {
        v.timestamps = v.timestamps.filter((t) => t > threshold);
        if (v.timestamps.length === 0) {
          this.storage.delete(k);
        }
      }
      this.lastCleanup = now;
    }
  }
}

export const rateLimiter = new SlidingWindowRateLimiter();

/**
 * Convenience helper to enforce rate limiting on incoming API requests
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs = 60000
): { allowed: boolean; remaining: number; resetMs: number } {
  return rateLimiter.check(key, limit, windowMs);
}

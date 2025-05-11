import { Redis } from '@upstash/redis';
import env from '@/config/env';
import { logger } from './logger';

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

class RateLimiter {
  private redis: Redis;
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.redis = new Redis({
      url: env.REDIS_URL,
      token: env.REDIS_TOKEN,
    });
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async check(key: string): Promise<RateLimitResult> {
    try {
      const now = Date.now();
      const windowKey = `${key}:${Math.floor(now / this.windowMs)}`;
      
      // Get current count
      const count = await this.redis.incr(windowKey);
      
      // Set expiry on the window key
      await this.redis.expire(windowKey, Math.ceil(this.windowMs / 1000));
      
      // Calculate remaining requests
      const remaining = Math.max(0, this.maxRequests - count);
      
      // Calculate reset time
      const reset = Math.ceil((now + this.windowMs) / 1000);
      
      return {
        success: count <= this.maxRequests,
        remaining,
        reset,
      };
    } catch (error) {
      logger.error('Rate limiter error', error as Error, { key });
      // Fail open in case of Redis errors
      return {
        success: true,
        remaining: this.maxRequests,
        reset: Math.ceil((Date.now() + this.windowMs) / 1000),
      };
    }
  }

  async reset(key: string): Promise<void> {
    try {
      const now = Date.now();
      const windowKey = `${key}:${Math.floor(now / this.windowMs)}`;
      await this.redis.del(windowKey);
    } catch (error) {
      logger.error('Rate limiter reset error', error as Error, { key });
    }
  }
}

// Create instances for different rate limiting needs
export const apiRateLimiter = new RateLimiter(60000, 100); // 100 requests per minute
export const authRateLimiter = new RateLimiter(300000, 5); // 5 requests per 5 minutes

// Create rate limiters for different endpoints
export const loginRateLimiter = new RateLimiter(
  env.MAX_LOGIN_ATTEMPTS,
  env.LOGIN_ATTEMPT_WINDOW * 1000
);

export const passwordResetRateLimiter = new RateLimiter(3, 3600000); // 3 attempts per hour 
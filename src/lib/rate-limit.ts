import { Redis } from '@upstash/redis';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

const defaultConfig: RateLimitConfig = {
  maxRequests: 100,
  windowSeconds: 60,
};

type RedisScore = [string, number];

export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = defaultConfig
): Promise<{ success: boolean; limit: number; remaining: number }> {
  const ip = request.ip || 'anonymous';
  const key = `ratelimit:${ip}`;

  try {
    const now = Date.now();
    const windowStart = now - config.windowSeconds * 1000;

    // Get all requests and filter in memory
    const requests = await redis.zrange(key, 0, -1, { withScores: true }) as RedisScore[];
    const validRequests = requests.filter(([_, score]) => score >= windowStart);
    
    // Remove old requests
    if (validRequests.length < requests.length) {
      await redis.zremrangebyscore(key, 0, windowStart);
    }

    // Add new request
    await redis.zadd(key, { score: now, member: now.toString() });

    // Set expiry
    await redis.expire(key, config.windowSeconds);

    const currentRequests = validRequests.length + 1;
    const remaining = Math.max(0, config.maxRequests - currentRequests);

    return {
      success: currentRequests <= config.maxRequests,
      limit: config.maxRequests,
      remaining,
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    // Fail open in case of Redis errors
    return { success: true, limit: config.maxRequests, remaining: config.maxRequests };
  }
}

export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: RateLimitConfig
) {
  return async (request: NextRequest) => {
    const { success, remaining } = await rateLimit(request, config);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': remaining.toString(),
            'Retry-After': config?.windowSeconds.toString() || '60',
          },
        }
      );
    }

    const response = await handler(request);
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    return response;
  };
}
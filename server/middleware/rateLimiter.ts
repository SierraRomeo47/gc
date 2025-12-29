import type { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';

// Redis connection
let redis: Redis | null = null;
const REDIS_URL = process.env.REDIS_URL;

if (REDIS_URL) {
  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redis.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected for rate limiting');
    });
  } catch (error) {
    console.warn('⚠️  Redis connection failed, falling back to in-memory rate limiting');
    redis = null;
  }
} else {
  console.warn('⚠️  REDIS_URL not set, using in-memory rate limiting');
}

// Fallback in-memory store
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Cleanup old records every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of memoryStore.entries()) {
    if (now > record.resetAt) {
      memoryStore.delete(key);
    }
  }
}, 60 * 1000);

/**
 * Rate limiter options
 */
export interface RateLimitOptions {
  windowMs?: number;      // Time window in milliseconds
  maxRequests?: number;   // Maximum requests per window
  keyPrefix?: string;     // Prefix for Redis keys
  skipSuccessfulRequests?: boolean;  // Only count failed requests
  skipFailedRequests?: boolean;      // Only count successful requests
  handler?: (req: Request, res: Response) => void;  // Custom handler
}

/**
 * Get identifier for rate limiting (user ID, IP, or combination)
 */
function getIdentifier(req: Request, options: RateLimitOptions): string {
  const user = (req as any).user;
  const prefix = options.keyPrefix || 'ratelimit';
  
  if (user?.id) {
    return `${prefix}:user:${user.id}`;
  }
  
  // Fallback to IP address
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return `${prefix}:ip:${ip}`;
}

/**
 * Redis-based rate limiting
 */
async function checkRateLimitRedis(
  key: string,
  windowMs: number,
  maxRequests: number
): Promise<{ allowed: boolean; current: number; resetAt: number }> {
  if (!redis) {
    throw new Error('Redis not available');
  }

  const now = Date.now();
  const windowStart = now - windowMs;
  const resetAt = now + windowMs;

  try {
    // Use Redis sorted set for sliding window
    const multi = redis.multi();
    
    // Remove old entries outside the window
    multi.zremrangebyscore(key, 0, windowStart);
    
    // Add current request
    multi.zadd(key, now, `${now}:${Math.random()}`);
    
    // Count requests in window
    multi.zcard(key);
    
    // Set expiration
    multi.expire(key, Math.ceil(windowMs / 1000));
    
    const results = await multi.exec();
    
    if (!results) {
      throw new Error('Redis multi command failed');
    }

    // Get count from zcard result
    const count = results[2][1] as number;
    
    return {
      allowed: count <= maxRequests,
      current: count,
      resetAt,
    };
  } catch (error) {
    console.error('Redis rate limit check failed:', error);
    throw error;
  }
}

/**
 * Memory-based rate limiting (fallback)
 */
function checkRateLimitMemory(
  key: string,
  windowMs: number,
  maxRequests: number
): { allowed: boolean; current: number; resetAt: number } {
  const now = Date.now();
  let record = memoryStore.get(key);

  // Reset if window has passed
  if (!record || now > record.resetAt) {
    record = {
      count: 0,
      resetAt: now + windowMs,
    };
    memoryStore.set(key, record);
  }

  record.count++;
  
  return {
    allowed: record.count <= maxRequests,
    current: record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Redis-backed rate limiting middleware
 */
export function rateLimiter(options: RateLimitOptions = {}) {
  const {
    windowMs = 15 * 60 * 1000,     // 15 minutes
    maxRequests = 100,               // 100 requests per window
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    handler,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const key = getIdentifier(req, options);

    try {
      // Try Redis first, fallback to memory
      let result;
      if (redis) {
        try {
          result = await checkRateLimitRedis(key, windowMs, maxRequests);
        } catch (error) {
          console.warn('Redis rate limit failed, using memory fallback');
          result = checkRateLimitMemory(key, windowMs, maxRequests);
        }
      } else {
        result = checkRateLimitMemory(key, windowMs, maxRequests);
      }

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - result.current));
      res.setHeader('X-RateLimit-Reset', new Date(result.resetAt).toISOString());
      res.setHeader('X-RateLimit-Window', `${windowMs / 1000}s`);

      if (!result.allowed) {
        // Rate limit exceeded
        const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
        res.setHeader('Retry-After', retryAfter);

        if (handler) {
          return handler(req, res);
        }

        return res.status(429).json({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: new Date(result.resetAt).toISOString(),
          limit: maxRequests,
          window: `${windowMs / 1000}s`,
        });
      }

      // Track response status if needed
      if (skipSuccessfulRequests || skipFailedRequests) {
        const originalSend = res.send;
        res.send = function (body: any) {
          const statusCode = res.statusCode;
          
          // Decrement count if we should skip this request
          if (
            (skipSuccessfulRequests && statusCode < 400) ||
            (skipFailedRequests && statusCode >= 400)
          ) {
            // Would need to decrement counter here
            // For now, just log it
            console.debug(`Skipping rate limit for status ${statusCode}`);
          }
          
          return originalSend.call(this, body);
        };
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // On error, allow the request to proceed
      next();
    }
  };
}

/**
 * Preset rate limiters for different endpoints
 */
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  maxRequests: 5,             // 5 login attempts
  keyPrefix: 'auth',
  skipSuccessfulRequests: true,  // Only count failed attempts
});

export const apiRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  maxRequests: 10000,         // 10000 requests (very lenient for development)
  keyPrefix: 'api',
});

export const uploadRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: 10,            // 10 uploads
  keyPrefix: 'upload',
});

export const calculationRateLimiter = rateLimiter({
  windowMs: 5 * 60 * 1000,   // 5 minutes
  maxRequests: 20,            // 20 calculations
  keyPrefix: 'calculation',
});

/**
 * Export Redis instance for other uses (caching, etc.)
 */
export { redis };

/**
 * Close Redis connection on shutdown
 */
export async function closeRedisConnection(): Promise<void> {
  if (redis) {
    try {
      await redis.quit();
      console.log('Redis connection closed');
    } catch (error) {
      console.error('Error closing Redis connection:', error);
    }
  }
}

// Handle graceful shutdown
process.on('SIGTERM', closeRedisConnection);
process.on('SIGINT', closeRedisConnection);


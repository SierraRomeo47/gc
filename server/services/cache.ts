import { redis } from '../middleware/rateLimiter';

/**
 * Cache key prefixes
 */
export enum CachePrefix {
  PORT = 'port',
  FUEL = 'fuel',
  VESSEL = 'vessel',
  VOYAGE = 'voyage',
  USER = 'user',
  CALCULATION = 'calc',
  REFERENCE_DATA = 'ref',
  SESSION = 'session',
}

/**
 * Cache TTL (Time To Live) in seconds
 */
export const CacheTTL = {
  REFERENCE_DATA: 3600,        // 1 hour for ports, fuels
  CALCULATION_RESULT: 900,     // 15 minutes for calculations
  USER_SESSION: 86400,         // 24 hours for sessions
  VESSEL_DATA: 1800,           // 30 minutes for vessel data
  SHORT: 300,                  // 5 minutes for frequently changing data
  LONG: 7200,                  // 2 hours for rarely changing data
};

/**
 * Cache service using Redis with fallback to memory
 */
export class CacheService {
  private memoryCache: Map<string, { value: any; expiresAt: number }> = new Map();
  private useRedis: boolean = false;

  constructor() {
    this.useRedis = redis !== null;
    if (!this.useRedis) {
      console.warn('⚠️  Redis not available, using in-memory cache');
      
      // Cleanup expired entries every minute
      setInterval(() => this.cleanupMemoryCache(), 60000);
    }
  }

  /**
   * Generate cache key
   */
  private generateKey(prefix: CachePrefix, id: string | number): string {
    return `${prefix}:${id}`;
  }

  /**
   * Get value from cache
   */
  async get<T>(prefix: CachePrefix, id: string | number): Promise<T | null> {
    const key = this.generateKey(prefix, id);

    try {
      if (this.useRedis && redis) {
        const value = await redis.get(key);
        if (value) {
          return JSON.parse(value) as T;
        }
      } else {
        // Memory fallback
        const cached = this.memoryCache.get(key);
        if (cached && cached.expiresAt > Date.now()) {
          return cached.value as T;
        } else if (cached) {
          this.memoryCache.delete(key);
        }
      }
    } catch (error) {
      console.error('Cache get error:', error);
    }

    return null;
  }

  /**
   * Set value in cache
   */
  async set(
    prefix: CachePrefix,
    id: string | number,
    value: any,
    ttl: number = CacheTTL.SHORT
  ): Promise<boolean> {
    const key = this.generateKey(prefix, id);

    try {
      if (this.useRedis && redis) {
        await redis.setex(key, ttl, JSON.stringify(value));
        return true;
      } else {
        // Memory fallback
        this.memoryCache.set(key, {
          value,
          expiresAt: Date.now() + ttl * 1000,
        });
        return true;
      }
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(prefix: CachePrefix, id: string | number): Promise<boolean> {
    const key = this.generateKey(prefix, id);

    try {
      if (this.useRedis && redis) {
        await redis.del(key);
      } else {
        this.memoryCache.delete(key);
      }
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete all keys with prefix
   */
  async deletePattern(prefix: CachePrefix): Promise<boolean> {
    const pattern = `${prefix}:*`;

    try {
      if (this.useRedis && redis) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else {
        // Memory fallback
        for (const key of this.memoryCache.keys()) {
          if (key.startsWith(`${prefix}:`)) {
            this.memoryCache.delete(key);
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return false;
    }
  }

  /**
   * Get multiple values from cache
   */
  async getMany<T>(
    prefix: CachePrefix,
    ids: (string | number)[]
  ): Promise<Map<string | number, T>> {
    const results = new Map<string | number, T>();

    if (this.useRedis && redis) {
      try {
        const keys = ids.map((id) => this.generateKey(prefix, id));
        const values = await redis.mget(...keys);

        ids.forEach((id, index) => {
          if (values[index]) {
            results.set(id, JSON.parse(values[index]!) as T);
          }
        });
      } catch (error) {
        console.error('Cache getMany error:', error);
      }
    } else {
      // Memory fallback
      for (const id of ids) {
        const value = await this.get<T>(prefix, id);
        if (value) {
          results.set(id, value);
        }
      }
    }

    return results;
  }

  /**
   * Set multiple values in cache
   */
  async setMany(
    prefix: CachePrefix,
    values: Map<string | number, any>,
    ttl: number = CacheTTL.SHORT
  ): Promise<boolean> {
    try {
      if (this.useRedis && redis) {
        const pipeline = redis.pipeline();
        
        for (const [id, value] of values.entries()) {
          const key = this.generateKey(prefix, id);
          pipeline.setex(key, ttl, JSON.stringify(value));
        }
        
        await pipeline.exec();
      } else {
        // Memory fallback
        const expiresAt = Date.now() + ttl * 1000;
        for (const [id, value] of values.entries()) {
          const key = this.generateKey(prefix, id);
          this.memoryCache.set(key, { value, expiresAt });
        }
      }
      return true;
    } catch (error) {
      console.error('Cache setMany error:', error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(prefix: CachePrefix, id: string | number): Promise<boolean> {
    const key = this.generateKey(prefix, id);

    try {
      if (this.useRedis && redis) {
        const exists = await redis.exists(key);
        return exists === 1;
      } else {
        const cached = this.memoryCache.get(key);
        return cached !== undefined && cached.expiresAt > Date.now();
      }
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Increment counter in cache
   */
  async increment(
    prefix: CachePrefix,
    id: string | number,
    amount: number = 1
  ): Promise<number> {
    const key = this.generateKey(prefix, id);

    try {
      if (this.useRedis && redis) {
        return await redis.incrby(key, amount);
      } else {
        const cached = this.memoryCache.get(key);
        const current = cached?.value || 0;
        const newValue = current + amount;
        this.memoryCache.set(key, {
          value: newValue,
          expiresAt: cached?.expiresAt || Date.now() + CacheTTL.SHORT * 1000,
        });
        return newValue;
      }
    } catch (error) {
      console.error('Cache increment error:', error);
      return 0;
    }
  }

  /**
   * Get or set (cache-aside pattern)
   */
  async getOrSet<T>(
    prefix: CachePrefix,
    id: string | number,
    fetchFn: () => Promise<T>,
    ttl: number = CacheTTL.SHORT
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(prefix, id);
    if (cached !== null) {
      return cached;
    }

    // Fetch from source
    const value = await fetchFn();

    // Store in cache
    await this.set(prefix, id, value, ttl);

    return value;
  }

  /**
   * Clean up expired entries from memory cache
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expiresAt <= now) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.debug(`Cleaned up ${cleaned} expired cache entries`);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<boolean> {
    try {
      if (this.useRedis && redis) {
        await redis.flushdb();
      } else {
        this.memoryCache.clear();
      }
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    type: 'redis' | 'memory';
    size: number;
    hits?: number;
    misses?: number;
  }> {
    try {
      if (this.useRedis && redis) {
        const info = await redis.info('stats');
        const dbsize = await redis.dbsize();
        
        // Parse hits and misses from info string
        const hitsMatch = info.match(/keyspace_hits:(\d+)/);
        const missesMatch = info.match(/keyspace_misses:(\d+)/);
        
        return {
          type: 'redis',
          size: dbsize,
          hits: hitsMatch ? parseInt(hitsMatch[1]) : 0,
          misses: missesMatch ? parseInt(missesMatch[1]) : 0,
        };
      } else {
        return {
          type: 'memory',
          size: this.memoryCache.size,
        };
      }
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        type: this.useRedis ? 'redis' : 'memory',
        size: 0,
      };
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

/**
 * Helper functions for common cache operations
 */

// Cache all ports
export async function cacheAllPorts(ports: any[]): Promise<void> {
  const portsMap = new Map(ports.map((port) => [port.id, port]));
  await cacheService.setMany(CachePrefix.PORT, portsMap, CacheTTL.REFERENCE_DATA);
}

// Cache all fuels
export async function cacheAllFuels(fuels: any[]): Promise<void> {
  const fuelsMap = new Map(fuels.map((fuel) => [fuel.id, fuel]));
  await cacheService.setMany(CachePrefix.FUEL, fuelsMap, CacheTTL.REFERENCE_DATA);
}

// Cache calculation result
export async function cacheCalculation(
  vesselId: string,
  year: number,
  framework: string,
  result: any
): Promise<void> {
  const key = `${vesselId}:${year}:${framework}`;
  await cacheService.set(CachePrefix.CALCULATION, key, result, CacheTTL.CALCULATION_RESULT);
}

// Get cached calculation
export async function getCachedCalculation(
  vesselId: string,
  year: number,
  framework: string
): Promise<any | null> {
  const key = `${vesselId}:${year}:${framework}`;
  return await cacheService.get(CachePrefix.CALCULATION, key);
}

// Invalidate vessel-related caches
export async function invalidateVesselCaches(vesselId: string): Promise<void> {
  await cacheService.delete(CachePrefix.VESSEL, vesselId);
  // Also invalidate calculation caches for this vessel
  await cacheService.deletePattern(CachePrefix.CALCULATION);
}

export default cacheService;


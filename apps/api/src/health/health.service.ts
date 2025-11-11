import { Injectable } from '@nestjs/common';
import { getDatabase } from '@planday/database';
import { validateEnv } from '@planday/config';
import { sql } from 'drizzle-orm';
import Redis from 'ioredis';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  message?: string;
  responseTime?: number;
}

@Injectable()
export class HealthService {
  private redisClient: Redis | null = null;

  constructor() {
    const env = validateEnv();
    // Initialize Redis client if REDIS_URL is provided
    if (env.REDIS_URL) {
      try {
        this.redisClient = new Redis(env.REDIS_URL, {
          connectTimeout: 5000,
          maxRetriesPerRequest: 1,
          retryStrategy: () => null, // Don't retry on health checks
        });
      } catch (error) {
        // Redis connection will be checked on demand
        this.redisClient = null;
      }
    }
  }

  async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      const db = getDatabase();
      // Execute a simple query to check database connectivity
      await db.execute(sql`SELECT 1`);
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        message: 'Database connection is healthy',
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Database connection failed',
        responseTime,
      };
    }
  }

  async checkRedis(): Promise<HealthCheckResult> {
    const env = validateEnv();
    
    // If Redis is not configured, return healthy (optional service)
    if (!env.REDIS_URL) {
      return {
        status: 'healthy',
        message: 'Redis is not configured (optional)',
      };
    }

    const startTime = Date.now();
    
    try {
      // Create a temporary client for health check if not already created
      if (!this.redisClient) {
        this.redisClient = new Redis(env.REDIS_URL, {
          connectTimeout: 5000,
          maxRetriesPerRequest: 1,
          retryStrategy: () => null,
        });
      }

      // Ping Redis
      const result = await Promise.race([
        this.redisClient.ping(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Redis ping timeout')), 5000),
        ),
      ]);

      const responseTime = Date.now() - startTime;

      if (result === 'PONG') {
        return {
          status: 'healthy',
          message: 'Redis connection is healthy',
          responseTime,
        };
      } else {
        return {
          status: 'unhealthy',
          message: 'Redis ping returned unexpected result',
          responseTime,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Redis connection failed',
        responseTime,
      };
    }
  }

  async checkOverallHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    database: HealthCheckResult;
    redis: HealthCheckResult;
    timestamp: string;
  }> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const overallStatus =
      database.status === 'healthy' && redis.status === 'healthy'
        ? 'healthy'
        : 'unhealthy';

    return {
      status: overallStatus,
      database,
      redis,
      timestamp: new Date().toISOString(),
    };
  }

  onModuleDestroy() {
    // Clean up Redis connection on module destroy
    if (this.redisClient) {
      this.redisClient.disconnect();
      this.redisClient = null;
    }
  }
}


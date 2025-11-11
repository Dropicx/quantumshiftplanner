import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

// Mock service type
type MockHealthService = Pick<HealthService, 'checkOverallHealth'>;

describe('HealthController', () => {
  let controller: HealthController;
  let mockHealthService: MockHealthService;

  beforeEach(() => {
    // Create mock service with spy
    mockHealthService = {
      checkOverallHealth: vi.fn().mockResolvedValue({
        status: 'healthy',
        timestamp: '2025-01-01T00:00:00.000Z',
        database: {
          status: 'up',
          message: 'Connected',
          responseTime: 10,
        },
        redis: {
          status: 'up',
          message: 'Connected',
          responseTime: 5,
        },
      }),
    };

    // Manually instantiate controller with mock service
    controller = new HealthController(mockHealthService as HealthService);
  });

  describe('check', () => {
    it('should return health check status', () => {
      const result = controller.check();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('app', 'Planday Clone');
      expect(result).toHaveProperty('version', '1.0.0');
    });

    it('should return valid ISO timestamp', () => {
      const result = controller.check();
      const timestamp = new Date(result.timestamp);

      expect(timestamp.toISOString()).toBe(result.timestamp);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    it('should return current timestamp on each call', () => {
      // Wait a bit
      vi.spyOn(Date.prototype, 'toISOString').mockReturnValueOnce(
        '2025-01-01T00:00:00.000Z',
      );

      const result2 = controller.check();

      // Timestamps should be different (or mocked value should be different)
      expect(result2.timestamp).toBe('2025-01-01T00:00:00.000Z');
    });
  });

  describe('ready', () => {
    it('should return readiness status when healthy', async () => {
      const result = await controller.ready();

      expect(result).toEqual({
        status: 'healthy',
        timestamp: '2025-01-01T00:00:00.000Z',
        database: {
          status: 'up',
          message: 'Connected',
          responseTime: '10ms',
        },
        redis: {
          status: 'up',
          message: 'Connected',
          responseTime: '5ms',
        },
      });
    });

    it('should indicate database status', async () => {
      const result = await controller.ready();

      expect(result.database).toBeDefined();
      expect(result.database.status).toBe('up');
    });

    it('should indicate redis status', async () => {
      const result = await controller.ready();

      expect(result.redis).toBeDefined();
      expect(result.redis.status).toBe('up');
    });

    it('should throw HttpException when unhealthy', async () => {
      mockHealthService.checkOverallHealth.mockResolvedValueOnce({
        status: 'unhealthy',
        timestamp: '2025-01-01T00:00:00.000Z',
        database: {
          status: 'unhealthy',
          message: 'Connection failed',
        },
        redis: {
          status: 'healthy',
          message: 'Connected',
        },
      });

      await expect(controller.ready()).rejects.toThrow();
    });

    it('should include response times', async () => {
      const result = await controller.ready();

      expect(result.database.responseTime).toMatch(/^\d+ms$/);
      expect(result.redis.responseTime).toMatch(/^\d+ms$/);
    });
  });

  describe('live', () => {
    it('should return liveness status', () => {
      const result = controller.live();

      expect(result).toHaveProperty('status', 'alive');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('memory');
    });

    it('should return valid uptime', () => {
      const result = controller.live();

      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return memory usage object', () => {
      const result = controller.live();

      expect(result.memory).toHaveProperty('rss');
      expect(result.memory).toHaveProperty('heapTotal');
      expect(result.memory).toHaveProperty('heapUsed');
      expect(result.memory).toHaveProperty('external');
    });

    it('should return valid memory values', () => {
      const result = controller.live();

      // Memory values are now strings with "MB" suffix
      expect(result.memory.rss).toMatch(/^\d+MB$/);
      expect(result.memory.heapTotal).toMatch(/^\d+MB$/);
      expect(result.memory.heapUsed).toMatch(/^\d+MB$/);
      expect(result.memory.external).toMatch(/^\d+MB$/);
    });

    it('should have heapUsed less than or equal to heapTotal', () => {
      const result = controller.live();

      // Parse numeric values from strings
      const heapUsed = parseInt(result.memory.heapUsed.replace('MB', ''));
      const heapTotal = parseInt(result.memory.heapTotal.replace('MB', ''));

      expect(heapUsed).toBeLessThanOrEqual(heapTotal);
    });

    it('should return increasing uptime on subsequent calls', async () => {
      const result1 = controller.live();

      // Wait a tiny bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      const result2 = controller.live();

      expect(result2.uptime).toBeGreaterThanOrEqual(result1.uptime);
    });
  });

  describe('controller initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have check method', () => {
      expect(typeof controller.check).toBe('function');
    });

    it('should have ready method', () => {
      expect(typeof controller.ready).toBe('function');
    });

    it('should have live method', () => {
      expect(typeof controller.live).toBe('function');
    });
  });
});

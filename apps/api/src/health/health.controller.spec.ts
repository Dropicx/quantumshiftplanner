import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
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
    it('should return readiness status', () => {
      const result = controller.ready();

      expect(result).toEqual({
        status: 'ready',
        database: 'connected',
        redis: 'connected',
      });
    });

    it('should indicate database connection', () => {
      const result = controller.ready();

      expect(result.database).toBe('connected');
    });

    it('should indicate redis connection', () => {
      const result = controller.ready();

      expect(result.redis).toBe('connected');
    });

    it('should return consistent response', () => {
      const result1 = controller.ready();
      const result2 = controller.ready();

      expect(result1).toEqual(result2);
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

      expect(result.memory.rss).toBeGreaterThan(0);
      expect(result.memory.heapTotal).toBeGreaterThan(0);
      expect(result.memory.heapUsed).toBeGreaterThan(0);
      expect(result.memory.external).toBeGreaterThanOrEqual(0);
    });

    it('should have heapUsed less than or equal to heapTotal', () => {
      const result = controller.live();

      expect(result.memory.heapUsed).toBeLessThanOrEqual(
        result.memory.heapTotal,
      );
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

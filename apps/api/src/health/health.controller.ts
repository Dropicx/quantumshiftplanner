import {
  Controller,
  Get,
  HttpStatus,
  HttpCode,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { config } from '@planday/config';

import { HealthService } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      app: config.app.name,
      version: config.app.version,
    };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async ready() {
    const health = await this.healthService.checkOverallHealth();
    const statusCode =
      health.status === 'healthy'
        ? HttpStatus.OK
        : HttpStatus.SERVICE_UNAVAILABLE;

    const response = {
      status: health.status,
      timestamp: health.timestamp,
      database: {
        status: health.database.status,
        message: health.database.message,
        responseTime: health.database.responseTime
          ? `${health.database.responseTime}ms`
          : undefined,
      },
      redis: {
        status: health.redis.status,
        message: health.redis.message,
        responseTime: health.redis.responseTime
          ? `${health.redis.responseTime}ms`
          : undefined,
      },
    };

    // Set HTTP status code based on health
    if (statusCode !== HttpStatus.OK) {
      throw new HttpException(response, statusCode);
    }

    return response;
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  live() {
    const memoryUsage = process.memoryUsage();
    return {
      status: 'alive',
      uptime: process.uptime(),
      uptimeFormatted: this.formatUptime(process.uptime()),
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${secs}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
}

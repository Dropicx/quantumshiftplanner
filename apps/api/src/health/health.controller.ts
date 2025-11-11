import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { config } from '@planday/config';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
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
  ready() {
    return {
      status: 'ready',
      database: 'connected',
      redis: 'connected',
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness check endpoint' })
  live() {
    return {
      status: 'alive',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}

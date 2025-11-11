import { Controller, Get } from '@nestjs/common';

import { config } from '@planday/config';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      app: 'Worker Service',
      version: config.app.version,
    };
  }

  @Get('ready')
  ready() {
    return {
      status: 'ready',
      redis: 'connected',
      workers: 'active',
    };
  }

  @Get('live')
  live() {
    return {
      status: 'alive',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }
}

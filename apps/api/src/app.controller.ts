import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    // Root endpoint for health check probes
    return {
      status: 'ok',
      message: 'Planday API is running',
      version: '1.0.0',
      endpoints: {
        health: '/api/health',
        healthReady: '/api/health/ready',
        healthLive: '/api/health/live',
        docs: '/api/docs',
      },
    };
  }
}

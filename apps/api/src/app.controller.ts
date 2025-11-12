import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Root')
@Controller()
export class AppController {
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Root endpoint - API information' })
  @ApiResponse({
    status: 200,
    description: 'API is running and returns basic information',
  })
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

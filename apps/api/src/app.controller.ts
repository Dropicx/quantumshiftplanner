import { Controller, Get, Redirect } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  @Redirect('/api/health', 302)
  getRoot() {
    // Redirect root path to health check endpoint
    // This prevents 404 errors from health check probes
    return;
  }
}

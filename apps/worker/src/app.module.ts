import { Module, OnModuleInit } from '@nestjs/common';

import { HealthModule } from './health/health.module';
import { EmailProcessorService } from './processors/email.processor';
import { NotificationProcessorService } from './processors/notification.processor';
import { ReportProcessorService } from './processors/report.processor';

@Module({
  imports: [HealthModule],
  providers: [
    EmailProcessorService,
    NotificationProcessorService,
    ReportProcessorService,
  ],
})
export class AppModule implements OnModuleInit {
  constructor(
    // eslint-disable-next-line no-unused-vars
    private readonly emailProcessor: EmailProcessorService,
    // eslint-disable-next-line no-unused-vars
    private readonly notificationProcessor: NotificationProcessorService,
    // eslint-disable-next-line no-unused-vars
    private readonly reportProcessor: ReportProcessorService,
  ) {}

  async onModuleInit() {
    // Start all workers when the module initializes
    await this.emailProcessor.start();
    await this.notificationProcessor.start();
    await this.reportProcessor.start();

    // eslint-disable-next-line no-console
    console.log('✅ All background workers started successfully');
  }
}

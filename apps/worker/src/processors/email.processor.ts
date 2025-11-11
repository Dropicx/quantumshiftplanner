import { Injectable, Logger } from '@nestjs/common';
import { Job, Worker } from 'bullmq';

import { validateEnv } from '@planday/config';

interface EmailJob {
  type: 'shift-assigned' | 'shift-reminder' | 'password-reset' | 'welcome';
  to: string;
  subject: string;
  data: Record<string, any>;
}

@Injectable()
export class EmailProcessorService {
  private readonly logger = new Logger(EmailProcessorService.name);
  private worker: Worker | null = null;

  async start() {
    const env = validateEnv();

    // Parse Redis URL if provided, otherwise use default
    const redisConfig = this.parseRedisUrl(env.REDIS_URL || 'redis://localhost:6379');

    this.worker = new Worker(
      'email-queue',
      async (job: Job<EmailJob>) => {
        this.logger.log(`Processing email job: ${job.id} - Type: ${job.data.type}`);

        try {
          await this.processEmail(job.data);
          this.logger.log(`Email job ${job.id} completed successfully`);
          return { success: true };
        } catch (error) {
          this.logger.error(`Email job ${job.id} failed:`, error);
          throw error;
        }
      },
      {
        connection: redisConfig,
        concurrency: 5, // Process 5 emails concurrently
      }
    );

    this.worker.on('completed', (job) => {
      this.logger.debug(`Email job ${job.id} has been completed`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Email job ${job?.id} failed with error:`, err);
    });

    this.logger.log('✅ Email processor started');
  }

  private async processEmail(jobData: EmailJob): Promise<void> {
    const { type, to, subject, data } = jobData;

    // TODO: Integrate with Maileroo API
    // For now, just log the email details
    this.logger.log(`
📧 Email to be sent:
   Type: ${type}
   To: ${to}
   Subject: ${subject}
   Data: ${JSON.stringify(data, null, 2)}
    `);

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // TODO: Actual Maileroo integration:
    // const response = await fetch('https://api.maileroo.com/v1/send', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'X-API-Key': process.env.MAILEROO_API_KEY,
    //   },
    //   body: JSON.stringify({
    //     from: process.env.MAILEROO_FROM_EMAIL,
    //     to: to,
    //     subject: subject,
    //     html: this.renderEmailTemplate(type, data),
    //   }),
    // });
  }

  private parseRedisUrl(url: string): { host: string; port: number; password?: string } {
    try {
      const parsedUrl = new URL(url);
      const config: { host: string; port: number; password?: string } = {
        host: parsedUrl.hostname,
        port: parseInt(parsedUrl.port || '6379', 10),
      };

      // Extract password from URL (format: redis://:password@host:port or redis://user:password@host:port)
      if (parsedUrl.password) {
        config.password = parsedUrl.password;
      }

      return config;
    } catch {
      // Fallback to localhost if URL parsing fails
      return {
        host: 'localhost',
        port: 6379,
      };
    }
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
      this.logger.log('Email processor stopped');
    }
  }
}

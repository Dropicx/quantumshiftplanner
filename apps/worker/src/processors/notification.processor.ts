import { Injectable, Logger } from '@nestjs/common';
import { Job, Worker } from 'bullmq';

import { validateEnv } from '@planday/config';

interface NotificationJob {
  type: 'shift-update' | 'swap-request' | 'message' | 'reminder';
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

@Injectable()
export class NotificationProcessorService {
  private readonly logger = new Logger(NotificationProcessorService.name);
  private worker: Worker | null = null;

  async start() {
    const env = validateEnv();

    // Parse Redis URL if provided, otherwise use default
    const redisConfig = this.parseRedisUrl(env.REDIS_URL || 'redis://localhost:6379');

    this.worker = new Worker(
      'notification-queue',
      async (job: Job<NotificationJob>) => {
        this.logger.log(`Processing notification job: ${job.id} - Type: ${job.data.type}`);

        try {
          await this.processNotification(job.data);
          this.logger.log(`Notification job ${job.id} completed successfully`);
          return { success: true };
        } catch (error) {
          this.logger.error(`Notification job ${job.id} failed:`, error);
          throw error;
        }
      },
      {
        connection: redisConfig,
        concurrency: 10, // Process 10 notifications concurrently
      }
    );

    this.worker.on('completed', (job) => {
      this.logger.debug(`Notification job ${job.id} has been completed`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Notification job ${job?.id} failed with error:`, err);
    });

    this.logger.log('✅ Notification processor started');
  }

  private async processNotification(jobData: NotificationJob): Promise<void> {
    const { type, userId, title, body, data } = jobData;

    // TODO: Integrate with Firebase Cloud Messaging (FCM)
    // For now, just log the notification details
    this.logger.log(`
🔔 Push notification to be sent:
   Type: ${type}
   User ID: ${userId}
   Title: ${title}
   Body: ${body}
   Data: ${JSON.stringify(data, null, 2)}
    `);

    // Simulate notification sending delay
    await new Promise((resolve) => setTimeout(resolve, 50));

    // TODO: Actual FCM integration:
    // 1. Get user's FCM token from database
    // 2. Send notification via FCM:
    // const response = await fetch('https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${getFCMAccessToken()}`,
    //   },
    //   body: JSON.stringify({
    //     message: {
    //       token: userFcmToken,
    //       notification: {
    //         title: title,
    //         body: body,
    //       },
    //       data: data,
    //     },
    //   }),
    // });
  }

  private parseRedisUrl(url: string): { host: string; port: number } {
    try {
      const parsedUrl = new URL(url);
      return {
        host: parsedUrl.hostname,
        port: parseInt(parsedUrl.port || '6379', 10),
      };
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
      this.logger.log('Notification processor stopped');
    }
  }
}

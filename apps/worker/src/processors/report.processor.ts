import { Injectable, Logger } from '@nestjs/common';
import { Job, Worker } from 'bullmq';

import { validateEnv } from '@planday/config';

interface ReportJob {
  type: 'payroll' | 'attendance' | 'analytics' | 'export';
  organizationId: string;
  userId: string;
  format: 'pdf' | 'csv' | 'xlsx';
  params: Record<string, any>;
}

@Injectable()
export class ReportProcessorService {
  private readonly logger = new Logger(ReportProcessorService.name);
  private worker: Worker | null = null;

  async start() {
    const env = validateEnv();

    // Parse Redis URL if provided, otherwise use default
    const redisConfig = this.parseRedisUrl(env.REDIS_URL || 'redis://localhost:6379');

    this.worker = new Worker(
      'report-queue',
      async (job: Job<ReportJob>) => {
        this.logger.log(`Processing report job: ${job.id} - Type: ${job.data.type}`);

        try {
          await this.processReport(job.data);
          this.logger.log(`Report job ${job.id} completed successfully`);
          return { success: true };
        } catch (error) {
          this.logger.error(`Report job ${job.id} failed:`, error);
          throw error;
        }
      },
      {
        connection: redisConfig,
        concurrency: 2, // Process 2 reports concurrently (reports are heavy)
      }
    );

    this.worker.on('completed', (job) => {
      this.logger.debug(`Report job ${job.id} has been completed`);
    });

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Report job ${job?.id} failed with error:`, err);
    });

    this.logger.log('✅ Report processor started');
  }

  private async processReport(jobData: ReportJob): Promise<void> {
    const { type, organizationId, userId, format, params } = jobData;

    // TODO: Implement report generation
    // For now, just log the report details
    this.logger.log(`
📊 Report to be generated:
   Type: ${type}
   Organization ID: ${organizationId}
   User ID: ${userId}
   Format: ${format}
   Params: ${JSON.stringify(params, null, 2)}
    `);

    // Simulate report generation delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // TODO: Actual report generation:
    // 1. Fetch data from database based on type and params
    // 2. Generate report in requested format (PDF, CSV, XLSX)
    // 3. Upload to Cloudflare R2
    // 4. Send email notification with download link
    // 5. Store report metadata in database

    // Example workflow:
    // const data = await this.fetchReportData(type, organizationId, params);
    // const reportBuffer = await this.generateReport(data, format);
    // const downloadUrl = await this.uploadToR2(reportBuffer, `reports/${organizationId}/${type}-${Date.now()}.${format}`);
    // await this.sendReportEmail(userId, type, downloadUrl);
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
      this.logger.log('Report processor stopped');
    }
  }
}

import { Injectable, LoggerService } from '@nestjs/common';
import {
  WinstonModuleOptions,
  WinstonModuleOptionsFactory,
} from 'nest-winston';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

import { validateEnv } from '@planday/config';

@Injectable()
export class LoggerConfigService implements WinstonModuleOptionsFactory {
  createWinstonModuleOptions(): WinstonModuleOptions {
    const env = validateEnv();
    const isDevelopment = env.NODE_ENV === 'development';
    const logLevel = env.LOG_LEVEL;

    // Base format for all transports
    const baseFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
    );

    // Format for development (pretty print)
    const developmentFormat = winston.format.combine(
      baseFormat,
      winston.format.colorize({ all: true }),
      winston.format.printf(
        ({ timestamp, level, message, context, correlationId, ...meta }) => {
          const contextStr = context ? `[${context}]` : '';
          const correlationStr = correlationId ? `[${correlationId}]` : '';
          const metaStr = Object.keys(meta).length
            ? ` ${JSON.stringify(meta)}`
            : '';
          return `${timestamp} ${level} ${contextStr}${correlationStr} ${message}${metaStr}`;
        },
      ),
    );

    // Format for production (JSON)
    const productionFormat = winston.format.combine(
      baseFormat,
      winston.format.json(),
    );

    const transports: winston.transport[] = [
      // Console transport (always enabled)
      new winston.transports.Console({
        format: isDevelopment ? developmentFormat : productionFormat,
        level: logLevel,
      }),
    ];

    // File transports for production
    if (env.NODE_ENV === 'production') {
      // Error log file
      transports.push(
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          format: productionFormat,
          maxSize: '20m',
          maxFiles: '14d',
          zippedArchive: true,
        }),
      );

      // Combined log file
      transports.push(
        new DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          format: productionFormat,
          maxSize: '20m',
          maxFiles: '14d',
          zippedArchive: true,
        }),
      );
    }

    return {
      level: logLevel,
      transports,
      exitOnError: false,
    };
  }
}

@Injectable()
export class AppLoggerService implements LoggerService {
  // eslint-disable-next-line no-unused-vars
  constructor(private readonly logger: winston.Logger) {}

  log(message: string, context?: string, correlationId?: string) {
    this.logger.info(message, { context, correlationId });
  }

  error(
    message: string,
    trace?: string,
    context?: string,
    correlationId?: string,
  ) {
    this.logger.error(message, {
      context,
      correlationId,
      trace,
      stack: trace,
    });
  }

  warn(message: string, context?: string, correlationId?: string) {
    this.logger.warn(message, { context, correlationId });
  }

  debug(message: string, context?: string, correlationId?: string) {
    this.logger.debug(message, { context, correlationId });
  }

  verbose(message: string, context?: string, correlationId?: string) {
    this.logger.verbose(message, { context, correlationId });
  }

  // Additional method for structured logging
  logWithMeta(
    level: 'info' | 'warn' | 'error' | 'debug' | 'verbose',
    message: string,
    meta: Record<string, any>,
    context?: string,
    correlationId?: string,
  ) {
    this.logger[level](message, {
      ...meta,
      context,
      correlationId,
    });
  }
}

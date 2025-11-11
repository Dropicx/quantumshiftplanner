import { Global, Module } from '@nestjs/common';
import { WinstonModule, WINSTON_MODULE_PROVIDER } from 'nest-winston';
import * as winston from 'winston';

import { AppLoggerService, LoggerConfigService } from './logger.service';

@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      useClass: LoggerConfigService,
    }),
  ],
  providers: [
    {
      provide: AppLoggerService,
      useFactory: (winstonLogger: winston.Logger) => {
        return new AppLoggerService(winstonLogger);
      },
      inject: [WINSTON_MODULE_PROVIDER],
    },
  ],
  exports: [AppLoggerService, WinstonModule],
})
export class LoggerModule {}


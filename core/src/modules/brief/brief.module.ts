import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { BriefService } from './application/brief.service.js';
import { AIQueueService } from './application/ai-queue.service.js';
import { DrizzleBriefRepository } from './infrastructure/repositories/drizzle-brief.repository.js';
import { DrizzleAiResultRepository } from './infrastructure/repositories/drizzle-ai-result.repository.js';
import { DrizzleAIJobRepository } from './infrastructure/repositories/drizzle-ai-job.repository.js';
import { BRIEF_REPOSITORY } from './domain/repositories/brief.repository.js';
import { AI_RESULT_REPOSITORY } from './domain/repositories/ai-result.repository.js';
import { AI_JOB_REPOSITORY } from './domain/repositories/ai-job.repository.js';
import {
  InternalBriefController,
  BriefController,
} from './presentation/brief.controller.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),

        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],
  providers: [
    BriefService,
    AIQueueService,
    {
      provide: BRIEF_REPOSITORY,
      useClass: DrizzleBriefRepository,
    },
    {
      provide: AI_RESULT_REPOSITORY,
      useClass: DrizzleAiResultRepository,
    },
    {
      provide: AI_JOB_REPOSITORY,
      useClass: DrizzleAIJobRepository,
    },
  ],
  controllers: [BriefController, InternalBriefController],
  exports: [BriefService, AI_JOB_REPOSITORY],
})
export class BriefModule {}

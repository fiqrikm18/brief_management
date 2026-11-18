import { Module } from '@nestjs/common';
import { BriefService } from './application/brief.service.js';
import { DrizzleBriefRepository } from './infrastructure/repositories/drizzle-brief.repository.js';
import { DrizzleAiResultRepository } from './infrastructure/repositories/drizzle-ai-result.repository.js';
import { BRIEF_REPOSITORY } from './domain/repositories/brief.repository.js';
import { AI_RESULT_REPOSITORY } from './domain/repositories/ai-result.repository.js';
import {
  InternalBriefController,
  BriefController,
} from './presentation/brief.controller.js';

@Module({
  providers: [
    BriefService,
    {
      provide: BRIEF_REPOSITORY,
      useClass: DrizzleBriefRepository,
    },
    {
      provide: AI_RESULT_REPOSITORY,
      useClass: DrizzleAiResultRepository,
    },
  ],
  controllers: [BriefController, InternalBriefController],
  exports: [BriefService],
})
export class BriefModule {}

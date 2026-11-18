import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

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

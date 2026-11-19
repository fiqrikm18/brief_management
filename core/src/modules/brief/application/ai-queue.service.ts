import {
  Injectable,
  Inject,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';

import {
  AI_JOB_REPOSITORY,
  type IAIJobRepository,
} from '../domain/repositories/ai-job.repository.js';
import {
  BRIEF_REPOSITORY,
  type IBriefRepository,
} from '../domain/repositories/brief.repository.js';
import {
  AI_RESULT_REPOSITORY,
  type IAiResultRepository,
} from '../domain/repositories/ai-result.repository.js';
import { briefAiAnalysisSchema } from './schemas/ai-result.schema.js';

const POLL_INTERVAL_MS = 2000;

@Injectable()
export class AIQueueService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(AIQueueService.name);
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private processing = false;

  constructor(
    @Inject(AI_JOB_REPOSITORY)
    private readonly jobRepo: IAIJobRepository,
    @Inject(BRIEF_REPOSITORY)
    private readonly briefRepo: IBriefRepository,
    @Inject(AI_RESULT_REPOSITORY)
    private readonly aiRepo: IAiResultRepository,
  ) {}

  onModuleInit() {
    this.start();
  }

  onApplicationShutdown() {
    this.stop();
  }

  start() {
    if (this.intervalId) {
      return;
    }

    this.logger.log('AI queue worker started');
    void this.processOnce();

    this.intervalId = setInterval(() => {
      void this.processOnce();
    }, POLL_INTERVAL_MS);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.logger.log('AI queue worker stopped');
  }

  private async processOnce() {
    if (this.processing) {
      return;
    }

    this.processing = true;
    try {
      let job;
      try {
        job = await this.jobRepo.claimNext();
      } catch (error: any) {
        this.logger.error(`Failed to poll AI jobs:`, error.message);
        return;
      }

      if (!job) {
        return;
      }

      this.logger.log(
        `Processing AI job ${job.id} for brief ${job.briefId} (attempt ${job.attempts})`,
      );

      try {
        const brief = await this.briefRepo.findById(job.briefId);
        if (!brief) {
          throw new Error(`Brief ${job.briefId} not found`);
        }

        await this.aiRepo.markPending(job.briefId);

        const { object } = await generateObject({
          model: this.getAiModel(job.provider as 'google' | 'openai'),
          schema: briefAiAnalysisSchema,
          prompt: `Analisis brief proyek berikut secara profesional untuk agensi digital:
        "${brief.requirements}"`,
        });

        await this.aiRepo.saveSuccess({
          briefId: job.briefId,
          aiSummary: object.summary,
          serviceCategory: object.serviceCategory,
          priority: object.priority,
          priorityReason: object.priorityReason,
          missingInfos: object.missingInfo,
        });

        await this.jobRepo.markCompleted(job.id);
        this.logger.log(`AI job ${job.id} completed`);
      } catch (error: any) {
        this.logger.error(`AI job ${job.id} failed:`, error.message);
        await this.jobRepo.markFailed(job.id, error.message ?? String(error));
        await this.aiRepo.markFailed(
          job.briefId,
          error.message ?? 'Unknown AI processing error',
        );
      }
    } finally {
      this.processing = false;
    }
  }

  private getAiModel(provider: 'google' | 'openai' = 'google') {
    if (provider === 'openai') {
      return openai('gpt-4o-mini');
    }
    return google('gemini-3.8-flash');
  }
}

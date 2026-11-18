import { Injectable, Inject } from '@nestjs/common';

import {
  BRIEF_REPOSITORY,
  type IBriefRepository,
} from '../domain/repositories/brief.repository.js';
import {
  AI_RESULT_REPOSITORY,
  type IAiResultRepository,
} from '../domain/repositories/ai-result.repository.js';
import {
  AI_JOB_REPOSITORY,
  type IAIJobRepository,
} from '../domain/repositories/ai-job.repository.js';
import { NewBrief } from '../domain/entities/brief.entity.js';
import { PipelineStatus } from '../domain/enums.domain.js';

@Injectable()
export class BriefService {
  constructor(
    @Inject(BRIEF_REPOSITORY)
    private readonly briefRepo: IBriefRepository,
    @Inject(AI_RESULT_REPOSITORY)
    private readonly aiRepo: IAiResultRepository,
    @Inject(AI_JOB_REPOSITORY)
    private readonly jobRepo: IAIJobRepository,
  ) {}

  async createBrief(
    data: NewBrief,
    aiProvider: 'google' | 'openai' = 'google',
  ) {
    const briefWithAi = await this.briefRepo.createWithPendingAi(data);

    // Enqueue AI analysis to the background queue instead of running inline.
    // This keeps the create brief request fast and lets the queue worker
    // process LLM calls sequentially with retries.
    await this.jobRepo.enqueue({
      briefId: briefWithAi.id,
      provider: aiProvider,
    });

    return briefWithAi;
  }

  async getBriefs(filters?: {
    category?: string;
    priority?: string;
    aiStatus?: 'PENDING' | 'COMPLETED' | 'FAILED';
    pipelineStatus?: PipelineStatus;
    page?: number;
    limit?: number;
  }) {
    return await this.briefRepo.findAll(filters);
  }

  async getBriefDetail(id: string) {
    return await this.briefRepo.findById(id);
  }

  async updatePipelineStatus(id: string, status: PipelineStatus) {
    return await this.briefRepo.updatePipelineStatus(id, status);
  }

  async retryAiProcessing(
    briefId: string,
    aiProvider: 'google' | 'openai' = 'google',
  ) {
    const brief = await this.briefRepo.findById(briefId);
    if (!brief) {
      throw new Error(`Brief with ID ${briefId} not found.`);
    }

    // Re-enqueue AI analysis for retry.
    await this.jobRepo.enqueue({
      briefId,
      provider: aiProvider,
    });

    return await this.briefRepo.findById(briefId);
  }

  async getAIJobByBriefId(briefId: string) {
    return await this.jobRepo.findByBriefId(briefId);
  }
}

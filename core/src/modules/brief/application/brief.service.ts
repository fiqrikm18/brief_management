import { Injectable, Inject } from '@nestjs/common';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import {
  BRIEF_REPOSITORY,
  type IBriefRepository,
} from '../domain/repositories/brief.repository.js';
import {
  AI_RESULT_REPOSITORY,
  type IAiResultRepository,
} from '../domain/repositories/ai-result.repository.js';
import { briefAiAnalysisSchema } from './schemas/ai-result.schema.js';
import { NewBrief } from '../domain/entities/brief.entity.js';
import { PipelineStatus } from '../domain/enums.domain.js';

@Injectable()
export class BriefService {
  constructor(
    @Inject(BRIEF_REPOSITORY)
    private readonly briefRepo: IBriefRepository,
    @Inject(AI_RESULT_REPOSITORY)
    private readonly aiRepo: IAiResultRepository,
  ) {}

  private getAiModel(provider: 'google' | 'openai' = 'google') {
    if (provider === 'openai') {
      return openai('gpt-4o-mini');
    }
    return google('gemini-2.5-flash');
  }

  private async executeAiAnalysis(
    briefId: string,
    requirements: string,
    provider: 'google' | 'openai' = 'google',
  ) {
    try {
      await this.aiRepo.markPending(briefId);

      const prompt = `Analisis brief proyek berikut secara profesional untuk agensi digital:
      "${requirements}"`;

      const { object } = await generateObject({
        model: this.getAiModel(provider),
        schema: briefAiAnalysisSchema,
        prompt: prompt,
      });

      await this.aiRepo.saveSuccess({
        briefId,
        aiSummary: object.summary,
        serviceCategory: object.serviceCategory,
        priority: object.priority,
        priorityReason: object.priorityReason,
        missingInfos: object.missingInfo,
      });
    } catch (error: any) {
      console.error(`AI Processing Failed for brief ${briefId}:`, error);
      await this.aiRepo.markFailed(
        briefId,
        error.message || 'Unknown AI processing error',
      );
    }
  }

  async createBrief(
    data: NewBrief,
    aiProvider: 'google' | 'openai' = 'google',
    isAsync: boolean = true,
  ) {
    const briefWithAi = await this.briefRepo.createWithPendingAi(data);

    if (isAsync) {
      this.executeAiAnalysis(
        briefWithAi.id,
        data.requirements,
        aiProvider,
      ).catch((err) => {
        console.error('Background AI execution error:', err);
      });
    } else {
      await this.executeAiAnalysis(
        briefWithAi.id,
        data.requirements,
        aiProvider,
      );
      return await this.briefRepo.findById(briefWithAi.id);
    }

    return briefWithAi;
  }

  async getBriefs(filters?: {
    category?: string;
    priority?: string;
    aiStatus?: 'PENDING' | 'COMPLETED' | 'FAILED';
    pipelineStatus?: PipelineStatus;
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

    await this.executeAiAnalysis(briefId, brief.requirements, aiProvider);

    return await this.briefRepo.findById(briefId);
  }
}

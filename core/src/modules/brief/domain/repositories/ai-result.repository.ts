import { AiProcessingResultWithMissingInfo } from '../entities/ai-result.entity.js';

export const AI_RESULT_REPOSITORY = Symbol('IAiResultRepository');

export interface SaveAiSuccessInput {
  briefId: string;
  aiSummary: string;
  serviceCategory: string;
  priority: string;
  priorityReason: string;
  missingInfos: string[];
}

export interface IAiResultRepository {
  markPending(briefId: string): Promise<void>;
  saveSuccess(
    input: SaveAiSuccessInput,
  ): Promise<AiProcessingResultWithMissingInfo>;
  markFailed(briefId: string, errorMessage: string): Promise<void>;
}

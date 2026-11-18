import {
  Brief,
  BriefWithAiResult,
  NewBrief,
} from '../entities/brief.entity.js';
import { PipelineStatus } from '../enums.domain.js';

export const BRIEF_REPOSITORY = Symbol('IBriefRepository');

export interface BriefFilterParams {
  category?: string;
  priority?: string;
  aiStatus?: 'PENDING' | 'COMPLETED' | 'FAILED';
  pipelineStatus?: PipelineStatus;
}

export interface IBriefRepository {
  createWithPendingAi(data: NewBrief): Promise<BriefWithAiResult>;
  findAll(filters?: BriefFilterParams): Promise<BriefWithAiResult[]>;
  findById(id: string): Promise<BriefWithAiResult | null>;
  updatePipelineStatus(
    id: string,
    status: PipelineStatus,
  ): Promise<Brief | null>;
}

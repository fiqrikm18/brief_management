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
  page?: number;
  limit?: number;
}

export interface BriefListResult {
  data: BriefWithAiResult[];
  total: number;
}

export interface IBriefRepository {
  createWithPendingAi(data: NewBrief): Promise<BriefWithAiResult>;
  findAll(filters?: BriefFilterParams): Promise<BriefListResult>;
  findById(id: string): Promise<BriefWithAiResult | null>;
  updatePipelineStatus(
    id: string,
    status: PipelineStatus,
  ): Promise<Brief | null>;
}

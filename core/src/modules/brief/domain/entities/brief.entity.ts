import { briefs } from '../../../../database/schema/index.js';
import { AiProcessingResultWithMissingInfo } from './ai-result.entity.js';

export type Brief = typeof briefs.$inferSelect;
export type NewBrief = typeof briefs.$inferInsert;
export type UpdateBrief = Partial<Omit<NewBrief, 'id' | 'createdAt'>>;

export interface BriefListResult {
  data: BriefWithAiResult[];
  total: number;
}

export interface BriefWithAiResult extends Brief {
  aiResult: AiProcessingResultWithMissingInfo | null;
}

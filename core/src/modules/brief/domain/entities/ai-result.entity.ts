import { aiProcessingResults } from '../../../../database/schema/ai-result.schema.js';
import { MissingInfoItem } from './missing-info.entity.js';

export type AiProcessingResult = typeof aiProcessingResults.$inferSelect;
export type NewAiProcessingResult = typeof aiProcessingResults.$inferInsert;
export type UpdateAiProcessingResult = Partial<
  Omit<NewAiProcessingResult, 'id' | 'briefId' | 'createdAt'>
>;

export interface AiProcessingResultWithMissingInfo extends AiProcessingResult {
  missingInfos: MissingInfoItem[];
}

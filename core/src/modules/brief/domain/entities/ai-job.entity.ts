import { aiJobs } from '../../../../database/schema/ai-job.schema.js';

export type AIJob = typeof aiJobs.$inferSelect;
export type NewAIJob = typeof aiJobs.$inferInsert;

export type AIJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface EnqueueAIJobInput {
  briefId: string;
  provider?: 'google' | 'openai';
}

export interface ClaimedAIJob extends AIJob {
  claimed: boolean;
}

export interface AIJobRepository {
  enqueue(input: EnqueueAIJobInput): Promise<AIJob>;
  claimNext(): Promise<AIJob | null>;
  markCompleted(id: string): Promise<void>;
  markFailed(id: string, errorMessage: string): Promise<void>;
  findByBriefId(briefId: string): Promise<AIJob | null>;
}

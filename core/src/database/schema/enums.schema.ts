import { pgEnum } from 'drizzle-orm/pg-core';

export const aiStatusEnum = pgEnum('ai_status', [
  'PENDING',
  'COMPLETED',
  'FAILED',
]);

export const pipelineStatusEnum = pgEnum('pipeline_status', [
  'NEW',
  'CONTACTED',
  'PROPOSAL',
  'WON',
  'LOST',
]);

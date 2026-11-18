import { pgTable, uuid, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { briefs } from './brief.schema.js';

export const aiJobs = pgTable(
  'ai_jobs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    briefId: uuid('brief_id')
      .notNull()
      .references(() => briefs.id, { onDelete: 'cascade' }),
    provider: text('provider', { enum: ['google', 'openai'] })
      .notNull()
      .default('google'),
    status: text('status', { enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] })
      .notNull()
      .default('PENDING'),
    attempts: integer('attempts').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(3),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
  },
  (table) => [
    index('ai_jobs_brief_idx').on(table.briefId),
    index('ai_jobs_status_idx').on(table.status),
  ],
);

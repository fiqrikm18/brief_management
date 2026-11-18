import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { pipelineStatusEnum } from './enums.schema.js';
import { aiProcessingResults } from './ai-result.schema.js';

export const briefs = pgTable(
  'briefs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clientName: text('client_name').notNull(),
    clientEmail: text('client_email').notNull(),
    companyName: text('company_name').notNull(),
    requirements: text('requirements').notNull(),
    budgetRange: text('budget_range').notNull(),
    targetTimeline: timestamp('target_timeline').notNull(),
    pipelineStatus: pipelineStatusEnum('pipeline_status')
      .default('NEW')
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('brief_pipeline_idx').on(table.pipelineStatus),
    index('brief_created_at_idx').on(table.createdAt),
  ],
);

export const briefsRelations = relations(briefs, ({ one }) => ({
  aiResult: one(aiProcessingResults, {
    fields: [briefs.id],
    references: [aiProcessingResults.briefId],
  }),
}));

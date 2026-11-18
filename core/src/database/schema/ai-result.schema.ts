import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { briefs } from './brief.schema.js';
import { aiStatusEnum } from './enums.schema.js';
import { missingInfoItems } from './missing-info.schema.js';

export const aiProcessingResults = pgTable(
  'ai_processing_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    briefId: uuid('brief_id')
      .notNull()
      .references(() => briefs.id, { onDelete: 'cascade' }),
    aiStatus: aiStatusEnum('ai_status').default('PENDING').notNull(),
    aiSummary: text('ai_summary'),
    serviceCategory: text('service_category'),
    priority: text('priority'),
    priorityReason: text('priority_reason'),
    aiErrorMessage: text('ai_error_message'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('ai_status_idx').on(table.aiStatus),
    index('ai_priority_idx').on(table.priority),
    index('ai_category_idx').on(table.serviceCategory),
  ],
);

export const aiProcessingResultsRelations = relations(
  aiProcessingResults,
  ({ one, many }) => ({
    brief: one(briefs, {
      fields: [aiProcessingResults.briefId],
      references: [briefs.id],
    }),
    missingInfos: many(missingInfoItems),
  }),
);

import { pgTable, uuid, text, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { aiProcessingResults } from './ai-result.schema.js';

export const missingInfoItems = pgTable(
  'missing_info_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    aiResultId: uuid('ai_result_id')
      .notNull()
      .references(() => aiProcessingResults.id, { onDelete: 'cascade' }),
    itemText: text('item_text').notNull(),
  },
  (table) => [index('missing_info_result_idx').on(table.aiResultId)],
);

export const missingInfoItemsRelations = relations(
  missingInfoItems,
  ({ one }) => ({
    aiResult: one(aiProcessingResults, {
      fields: [missingInfoItems.aiResultId],
      references: [aiProcessingResults.id],
    }),
  }),
);

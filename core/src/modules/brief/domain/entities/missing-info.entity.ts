import { missingInfoItems } from '../../../../database/schema/missing-info.schema.js';

export type MissingInfoItem = typeof missingInfoItems.$inferSelect;
export type NewMissingInfoItem = typeof missingInfoItems.$inferInsert;

import { eq } from 'drizzle-orm';
import { aiProcessingResults } from '../../../../database/schema/ai-result.schema.js';
import { missingInfoItems } from '../../../../database/schema/missing-info.schema.js';
import { AiProcessingResultWithMissingInfo } from '../../domain/entities/ai-result.entity.js';
import {
  IAiResultRepository,
  SaveAiSuccessInput,
} from '../../domain/repositories/ai-result.repository.js';
import { Inject } from '@nestjs/common';
import { DATABASE } from '../../../../database/database.provider.js';
import type { Database } from '../../../../database/database.types.js';

export class DrizzleAiResultRepository implements IAiResultRepository {
  constructor(
    @Inject(DATABASE)
    private readonly db: Database,
  ) {}

  async markPending(briefId: string): Promise<void> {
    await this.db
      .update(aiProcessingResults)
      .set({
        aiStatus: 'PENDING',
        aiErrorMessage: null,
        updatedAt: new Date(),
      })
      .where(eq(aiProcessingResults.briefId, briefId));
  }

  async saveSuccess(
    input: SaveAiSuccessInput,
  ): Promise<AiProcessingResultWithMissingInfo> {
    return await this.db.transaction(async (tx) => {
      const [updatedResult] = await tx
        .update(aiProcessingResults)
        .set({
          aiStatus: 'COMPLETED',
          aiSummary: input.aiSummary,
          serviceCategory: input.serviceCategory,
          priority: input.priority,
          priorityReason: input.priorityReason,
          aiErrorMessage: null,
          updatedAt: new Date(),
        })
        .where(eq(aiProcessingResults.briefId, input.briefId))
        .returning();

      if (!updatedResult) {
        throw new Error(
          `AI processing record not found for briefId: ${input.briefId}`,
        );
      }

      await tx
        .delete(missingInfoItems)
        .where(eq(missingInfoItems.aiResultId, updatedResult.id));

      let insertedMissingInfos: (typeof missingInfoItems.$inferSelect)[] = [];

      if (input.missingInfos.length > 0) {
        insertedMissingInfos = await tx
          .insert(missingInfoItems)
          .values(
            input.missingInfos.map((itemText) => ({
              aiResultId: updatedResult.id,
              itemText,
            })),
          )
          .returning();
      }

      return {
        ...updatedResult,
        missingInfos: insertedMissingInfos,
      };
    });
  }

  async markFailed(briefId: string, errorMessage: string): Promise<void> {
    await this.db
      .update(aiProcessingResults)
      .set({
        aiStatus: 'FAILED',
        aiErrorMessage: errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(aiProcessingResults.briefId, briefId));
  }
}

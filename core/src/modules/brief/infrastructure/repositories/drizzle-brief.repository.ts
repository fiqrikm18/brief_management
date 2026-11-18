import { Inject } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DATABASE } from '../../../../database/database.provider.js';
import type { Database } from '../../../../database/database.types.js';
import { aiProcessingResults } from '../../../../database/schema/ai-result.schema.js';
import { briefs } from '../../../../database/schema/brief.schema.js';
import {
  NewBrief,
  BriefWithAiResult,
  Brief,
} from '../../domain/entities/brief.entity.js';
import { PipelineStatus } from '../../domain/enums.domain.js';
import {
  IBriefRepository,
  BriefFilterParams,
} from '../../domain/repositories/brief.repository.js';

export class DrizzleBriefRepository implements IBriefRepository {
  constructor(
    @Inject(DATABASE)
    private readonly db: Database,
  ) {}

  async createWithPendingAi(data: NewBrief): Promise<BriefWithAiResult> {
    return await this.db.transaction(async (tx) => {
      const [createdBrief] = await tx.insert(briefs).values(data).returning();

      const [createdAiResult] = await tx
        .insert(aiProcessingResults)
        .values({
          briefId: createdBrief.id,
          aiStatus: 'PENDING',
        })
        .returning();

      return {
        ...createdBrief,
        aiResult: {
          ...createdAiResult,
          missingInfos: [],
        },
      };
    });
  }

  async findAll(filters?: BriefFilterParams): Promise<BriefWithAiResult[]> {
    const briefConditions = [];
    if (filters?.pipelineStatus) {
      briefConditions.push(eq(briefs.pipelineStatus, filters.pipelineStatus));
    }

    const results = await this.db.query.briefs.findMany({
      where: briefConditions.length > 0 ? and(...briefConditions) : undefined,
      orderBy: [desc(briefs.createdAt)],
      with: {
        aiResult: {
          with: {
            missingInfos: true,
          },
        },
      },
    });

    return results.filter((row) => {
      if (
        filters?.category &&
        row.aiResult?.serviceCategory !== filters.category
      ) {
        return false;
      }
      if (filters?.priority && row.aiResult?.priority !== filters.priority) {
        return false;
      }
      if (filters?.aiStatus && row.aiResult?.aiStatus !== filters.aiStatus) {
        return false;
      }
      return true;
    });
  }

  async findById(id: string): Promise<BriefWithAiResult | null> {
    const result = await this.db.query.briefs.findFirst({
      where: eq(briefs.id, id),
      with: {
        aiResult: {
          with: {
            missingInfos: true,
          },
        },
      },
    });

    return result ?? null;
  }

  async updatePipelineStatus(
    id: string,
    status: PipelineStatus,
  ): Promise<Brief | null> {
    const [updated] = await this.db
      .update(briefs)
      .set({
        pipelineStatus: status,
        updatedAt: new Date(),
      })
      .where(eq(briefs.id, id))
      .returning();

    return updated ?? null;
  }
}

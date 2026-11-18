import { Inject } from '@nestjs/common';
import { and, count, desc, eq } from 'drizzle-orm';
import { DATABASE } from '../../../../database/database.provider.js';
import type { Database } from '../../../../database/database.types.js';
import { aiProcessingResults } from '../../../../database/schema/ai-result.schema.js';
import { briefs } from '../../../../database/schema/brief.schema.js';
import {
  NewBrief,
  BriefWithAiResult,
  Brief,
  BriefListResult,
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

  async findAll(filters?: BriefFilterParams): Promise<BriefListResult> {
    const {
      page = 1,
      limit = 10,
      category,
      priority,
      aiStatus,
      pipelineStatus,
    } = filters ?? {};

    const conditions = [];

    if (pipelineStatus) {
      conditions.push(eq(briefs.pipelineStatus, pipelineStatus));
    }

    if (category) {
      conditions.push(eq(aiProcessingResults.serviceCategory, category));
    }

    if (priority) {
      conditions.push(eq(aiProcessingResults.priority, priority));
    }

    if (aiStatus) {
      conditions.push(eq(aiProcessingResults.aiStatus, aiStatus));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(briefs)
      .leftJoin(aiProcessingResults, eq(briefs.id, aiProcessingResults.briefId))
      .where(where);

    const rows = await this.db
      .select()
      .from(briefs)
      .leftJoin(aiProcessingResults, eq(briefs.id, aiProcessingResults.briefId))
      .where(where)
      .orderBy(desc(briefs.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    const data: BriefWithAiResult[] = rows.map(({ briefs: brief, ai_processing_results: aiResult }) => ({
      ...brief,
      aiResult: aiResult
        ? {
            ...aiResult,
            missingInfos: [],
          }
        : null,
    }));

    return {
      data,
      total: Number(total ?? 0),
    };
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

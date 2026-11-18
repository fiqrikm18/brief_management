import { Inject } from '@nestjs/common';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import { DATABASE } from '../../../../database/database.provider.js';
import type { Database } from '../../../../database/database.types.js';
import { aiJobs } from '../../../../database/schema/ai-job.schema.js';
import {
  AIJob,
  AIJobRepository,
  EnqueueAIJobInput,
} from '../../domain/entities/ai-job.entity.js';

export class DrizzleAIJobRepository implements AIJobRepository {
  constructor(
    @Inject(DATABASE)
    private readonly db: Database,
  ) {}

  async enqueue(input: EnqueueAIJobInput): Promise<AIJob> {
    const [job] = await this.db
      .insert(aiJobs)
      .values({
        briefId: input.briefId,
        provider: input.provider ?? 'google',
        status: 'PENDING',
        attempts: 0,
        maxAttempts: 3,
        errorMessage: null,
      })
      .returning();

    return job;
  }

  async claimNext(): Promise<AIJob | null> {
    const now = new Date();

    // Pick the oldest PENDING job that still has retries remaining.
    const [candidate] = await this.db
      .select({ id: aiJobs.id })
      .from(aiJobs)
      .where(
        and(
          eq(aiJobs.status, 'PENDING'),
          sql`${aiJobs.attempts} < ${aiJobs.maxAttempts}`,
        ),
      )
      .orderBy(aiJobs.createdAt)
      .limit(1);

    if (!candidate) {
      return null;
    }

    // Atomically claim it (single worker, so no concurrent claimers).
    const [claimed] = await this.db
      .update(aiJobs)
      .set({
        status: 'PROCESSING',
        startedAt: now,
        attempts: sql`${aiJobs.attempts} + 1`,
      })
      .where(eq(aiJobs.id, candidate.id))
      .returning();

    return claimed ?? null;
  }

  async markCompleted(id: string): Promise<void> {
    await this.db
      .update(aiJobs)
      .set({
        status: 'COMPLETED',
        completedAt: new Date(),
        errorMessage: null,
      })
      .where(eq(aiJobs.id, id));
  }

  async markFailed(id: string, errorMessage: string): Promise<void> {
    await this.db
      .update(aiJobs)
      .set({
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage,
      })
      .where(eq(aiJobs.id, id));
  }

  async findByBriefId(briefId: string): Promise<AIJob | null> {
    const [job] = await this.db
      .select()
      .from(aiJobs)
      .where(eq(aiJobs.briefId, briefId))
      .orderBy(desc(aiJobs.createdAt))
      .limit(1);

    return job ?? null;
  }

  async countByStatus(status: string): Promise<number> {
    const [{ total }] = await this.db
      .select({ total: count() })
      .from(aiJobs)
      .where(eq(aiJobs.status, status as any));

    return Number(total ?? 0);
  }
}

import type { AIJobRepository } from '../entities/ai-job.entity.js';

export const AI_JOB_REPOSITORY = Symbol('IAIJobRepository');

export type IAIJobRepository = AIJobRepository;

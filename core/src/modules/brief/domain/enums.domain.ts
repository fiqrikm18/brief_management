import {
  aiStatusEnum,
  pipelineStatusEnum,
} from '../../../database/schema/enums.schema.js';

export type AiStatus = (typeof aiStatusEnum.enumValues)[number];
export type PipelineStatus = (typeof pipelineStatusEnum.enumValues)[number];

export const AI_STATUSES = aiStatusEnum.enumValues;
export const PIPELINE_STATUSES = pipelineStatusEnum.enumValues;

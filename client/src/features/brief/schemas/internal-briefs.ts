import { z } from "zod";

export const PipelineStatusSchema = z.enum([
  "NEW",
  "CONTACTED",
  "PROPOSAL",
  "WON",
  "LOST",
]);

export const AiStatusSchema = z.enum(["PENDING", "COMPLETED", "FAILED"]);

export const ServiceCategorySchema = z.enum([
  "Branding",
  "Website",
  "Mobile App",
  "AI Automation",
  "Social Media",
  "Lainnya",
]);

export const BriefFiltersSchema = z
  .object({
    category: ServiceCategorySchema.optional(),
    priority: z.enum(["High", "Medium", "Low"]).optional(),
    aiStatus: AiStatusSchema.optional(),
    pipelineStatus: PipelineStatusSchema.optional(),
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional(),
  })
  .strip();

export type BriefFilters = z.infer<typeof BriefFiltersSchema>;

export const PipelineStatusUpdateSchema = z.object({
  pipelineStatus: PipelineStatusSchema,
});

export type PipelineStatusUpdate = z.infer<typeof PipelineStatusUpdateSchema>;

export const RetryAiRequestSchema = z.object({
  aiProvider: z.enum(["google", "openai"]).optional().default("google"),
});

export type RetryAiRequest = z.infer<typeof RetryAiRequestSchema>;

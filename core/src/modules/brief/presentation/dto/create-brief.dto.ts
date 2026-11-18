import { z } from 'zod';

export const createBriefSchema = z.object({
  clientName: z.string().min(1, 'Client name is required'),
  clientEmail: z.string().email('Invalid email format'),
  companyName: z.string().min(1, 'Company name is required'),
  requirements: z
    .string()
    .min(10, 'Requirements must be at least 10 characters'),
  budgetRange: z.string().min(1, 'Budget range is required'),
  targetTimeline: z.string().min(1, 'Target timeline is required'),
});

export type CreateBriefDto = z.infer<typeof createBriefSchema>;

import { z } from 'zod';

export const briefAiAnalysisSchema = z.object({
  summary: z
    .string()
    .describe('Ringkasan padat 1-2 kalimat mengenai kebutuhan proyek klien.'),
  serviceCategory: z
    .enum([
      'Branding',
      'Website',
      'Mobile App',
      'AI Automation',
      'Social Media',
      'Lainnya',
    ])
    .describe('Kategori layanan utama proyek berdasarkan kebutuhan klien.'),
  priority: z
    .enum(['High', 'Medium', 'Low'])
    .describe('Tingkat prioritas proyek.'),
  priorityReason: z
    .string()
    .describe('Alasan singkat mengapa tingkat prioritas tersebut dipilih.'),
  missingInfo: z
    .array(z.string())
    .describe(
      'Daftar informasi penting atau spesifikasi yang masih kurang dari brief klien.',
    ),
});

export type BriefAiAnalysisOutput = z.infer<typeof briefAiAnalysisSchema>;

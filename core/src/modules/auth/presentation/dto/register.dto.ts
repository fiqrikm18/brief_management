import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(100),

  email: z
    .string()
    .email()
    .max(255)
    .transform((value) => value.trim().toLowerCase()),

  password: z.string().min(8).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;

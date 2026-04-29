import { z } from 'zod';

const ReadingSectionSchema = z.object({
  title: z.string(),
  content: z.string(),
  score: z.number().int().min(0).max(100),
});

export const PalmReadingResultSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('palm'),
  personality: ReadingSectionSchema,
  career: ReadingSectionSchema,
  love: ReadingSectionSchema,
  health: ReadingSectionSchema,
  overallScore: z.number().int().min(1).max(100),
  summary: z.string(),
  createdAt: z.string().datetime(),
});

export type PalmReadingResult = z.infer<typeof PalmReadingResultSchema>;

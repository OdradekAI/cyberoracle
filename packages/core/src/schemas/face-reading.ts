import { z } from 'zod';

const FaceSectionSchema = z.object({
  title: z.string(),
  content: z.string(),
  score: z.number().int().min(0).max(100),
});

export const FaceReadingResultSchema = z.object({
  id: z.string().uuid(),
  type: z.literal('face'),
  fortune: FaceSectionSchema,
  career: FaceSectionSchema,
  relationship: FaceSectionSchema,
  wisdom: FaceSectionSchema,
  overallScore: z.number().int().min(1).max(100),
  summary: z.string(),
  createdAt: z.string().datetime(),
});

export type FaceReadingResult = z.infer<typeof FaceReadingResultSchema>;

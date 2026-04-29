import { z } from 'zod';

const FortuneAspectSchema = z.object({
  score: z.number().int().min(1).max(100),
  text: z.string(),
});

export const DailyFortuneResultSchema = z.strictObject({
  date: z.string(),
  overall: FortuneAspectSchema,
  love: FortuneAspectSchema,
  career: FortuneAspectSchema,
  wealth: FortuneAspectSchema,
  luckyNumber: z.number().int(),
  luckyColor: z.string(),
  summary: z.string(),
});

export type DailyFortuneResult = z.infer<typeof DailyFortuneResultSchema>;

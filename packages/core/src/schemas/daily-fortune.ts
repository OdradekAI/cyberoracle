import { z } from 'zod';

const ratingField = z.number().int().min(1).max(5);

export const DailyFortuneResultSchema = z.object({
  title: z.literal('今日心境速写'),
  date: z.string(),
  ganzhi: z.string(),
  solarTerm: z.string(),
  ratings: z.object({
    overall: ratingField,
    work: ratingField,
    relationship: ratingField,
    creative: ratingField,
    rest: ratingField,
  }),
  lucky: z.object({
    color: z.string(),
    direction: z.string(),
    number: z.number().int().min(0).max(9),
    moment: z.string(),
  }),
  advice: z.object({
    do: z.string(),
    avoid: z.string(),
  }),
  oneLine: z.string(),
});

export type DailyFortuneResult = z.infer<typeof DailyFortuneResultSchema>;

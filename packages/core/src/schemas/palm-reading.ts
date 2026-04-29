import { z } from 'zod';

export const PalmReadingResultSchema = z.object({
  meta: z.object({
    title: z.string(),
    subtitle: z.string(),
  }),
  overview: z.object({
    heading: z.string(),
    body: z.string(),
  }),
  mainLines: z
    .array(
      z.object({
        name: z.string(),
        icon: z.enum(['heart', 'brain', 'leaf']),
        body: z.string(),
      }),
    )
    .min(3)
    .max(3),
  auxiliary: z
    .array(
      z.object({
        icon: z.enum(['signpost', 'wave']),
        label: z.string(),
        body: z.string(),
      }),
    )
    .min(2)
    .max(3),
  temperament: z.object({
    heading: z.string(),
    body: z.string(),
  }),
  summary: z.object({
    heading: z.string(),
    body: z.string(),
    illustration: z.enum(['mountain', 'river', 'cloud', 'lotus']),
  }),
  disclaimer: z.object({
    label: z.string(),
    body: z.string(),
  }),
});

export type PalmReadingResult = z.infer<typeof PalmReadingResultSchema>;

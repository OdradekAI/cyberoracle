import { z } from 'zod';

export const FaceReadingResultSchema = z.object({
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
        icon: z.enum(['eyebrow', 'eye', 'nose', 'mouth', 'face']),
        body: z.string(),
      }),
    )
    .min(3)
    .max(4),
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

export type FaceReadingResult = z.infer<typeof FaceReadingResultSchema>;

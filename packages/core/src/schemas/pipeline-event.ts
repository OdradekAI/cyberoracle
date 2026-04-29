import { z } from 'zod';

export const PipelineEventSchema = z.object({
  step: z.enum(['vlm_observe', 'llm_interpret', 'complete']),
  status: z.enum(['running', 'done', 'error']),
  data: z.unknown(),
  error: z.string().optional(),
});

export type PipelineEvent = z.infer<typeof PipelineEventSchema>;

import { z } from 'zod';

const PalmRejectionReasonSchema = z.enum(['not_palm', 'minor', 'low_quality', 'unsafe']);

const PalmObservationsSchema = z.object({
  hand_shape: z.string(),
  finger: z.string(),
  palm_proportion: z.string(),
  heart_line: z.string(),
  head_line: z.string(),
  life_line: z.string(),
  fate_line: z.string(),
  minor_lines: z.string(),
  skin_texture: z.string(),
  image_quality: z.string(),
});

export const PalmObservationSchema = z.discriminatedUnion('valid', [
  z.object({
    valid: z.literal(true),
    observations: PalmObservationsSchema,
  }),
  z.object({
    valid: z.literal(false),
    reason: PalmRejectionReasonSchema,
  }),
]);

export type PalmObservation = z.infer<typeof PalmObservationSchema>;

const FaceRejectionReasonSchema = z.enum([
  'not_face',
  'minor',
  'multiple_faces',
  'low_quality',
  'unsafe',
]);

const FaceObservationsSchema = z.object({
  face_shape: z.string(),
  forehead: z.string(),
  eyebrow: z.string(),
  eye: z.string(),
  nose: z.string(),
  mouth: z.string(),
  chin: z.string(),
  skin_texture: z.string(),
  expression_impression: z.string(),
  image_quality: z.string(),
});

export const FaceObservationSchema = z.discriminatedUnion('valid', [
  z.object({
    valid: z.literal(true),
    observations: FaceObservationsSchema,
  }),
  z.object({
    valid: z.literal(false),
    reason: FaceRejectionReasonSchema,
  }),
]);

export type FaceObservation = z.infer<typeof FaceObservationSchema>;

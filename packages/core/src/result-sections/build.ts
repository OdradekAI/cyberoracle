import {
  PalmReadingResultSchema,
  type PalmReadingResult,
  FaceReadingResultSchema,
  type FaceReadingResult,
} from '../schemas';

export type ReadingKind = 'palm' | 'face';

export interface ResultSection {
  title: string;
  content: string;
}

/**
 * Convert a parsed PalmReadingResult / FaceReadingResult into the flat
 * ResultSection list consumed by the M2 result page.
 *
 * Returns null when the payload does not validate against the schema for the
 * given kind, signalling the caller should fall back to stub content rather
 * than render `[object Object]` placeholders.
 */
export function buildResultSections(kind: ReadingKind, data: unknown): ResultSection[] | null {
  if (kind === 'palm') {
    const parsed = PalmReadingResultSchema.safeParse(data);
    if (!parsed.success) return null;
    return mapReading(parsed.data);
  }

  const parsed = FaceReadingResultSchema.safeParse(data);
  if (!parsed.success) return null;
  return mapReading(parsed.data);
}

function mapReading(data: PalmReadingResult | FaceReadingResult): ResultSection[] {
  const sections: ResultSection[] = [];

  sections.push({
    title: data.overview.heading || '总览',
    content: data.overview.body,
  });

  for (const line of data.mainLines) {
    sections.push({ title: line.name, content: line.body });
  }

  for (const aux of data.auxiliary) {
    sections.push({ title: aux.label, content: aux.body });
  }

  sections.push({
    title: data.temperament.heading || '气质',
    content: data.temperament.body,
  });

  sections.push({
    title: data.summary.heading || '综合',
    content: data.summary.body,
  });

  sections.push({
    title: data.disclaimer.label || '阅读提示',
    content: data.disclaimer.body,
  });

  return sections;
}

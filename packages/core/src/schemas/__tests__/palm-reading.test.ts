import { describe, it, expect } from 'vitest';
import { PalmReadingResultSchema } from '../palm-reading';

const validData = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  type: 'palm' as const,
  personality: {
    title: '性格分析',
    content: '你是一个充满创造力的人。',
    score: 85,
  },
  career: {
    title: '事业运',
    content: '近期事业运势上升。',
    score: 78,
  },
  love: {
    title: '感情运',
    content: '感情生活将有新的变化。',
    score: 72,
  },
  health: {
    title: '健康运',
    content: '注意休息，保持良好作息。',
    score: 90,
  },
  overallScore: 81,
  summary: '综合运势良好，适合尝试新事物。',
  createdAt: '2026-04-29T00:00:00.000Z',
};

describe('PalmReadingResultSchema', () => {
  it('parses valid data without errors', () => {
    const result = PalmReadingResultSchema.parse(validData);
    expect(result.id).toBe(validData.id);
    expect(result.type).toBe('palm');
    expect(result.personality.score).toBe(85);
    expect(result.overallScore).toBe(81);
  });

  it('rejects data with missing required field', () => {
    const { personality: _personality, ...missingField } = validData;
    expect(() => PalmReadingResultSchema.parse(missingField)).toThrow();
  });

  it('rejects data with wrong type', () => {
    const wrongType = { ...validData, type: 'face' };
    expect(() => PalmReadingResultSchema.parse(wrongType)).toThrow();
  });

  it('rejects data with invalid overallScore (out of range)', () => {
    const outOfRange = { ...validData, overallScore: 150 };
    expect(() => PalmReadingResultSchema.parse(outOfRange)).toThrow();
  });

  it('rejects data with invalid id (non-uuid)', () => {
    const badId = { ...validData, id: 'not-a-uuid' };
    expect(() => PalmReadingResultSchema.parse(badId)).toThrow();
  });

  it('exports inferred type', () => {
    // Type-level test — ensures the inferred type is usable
    type PalmReading = typeof PalmReadingResultSchema._type;
    const _typed: PalmReading = validData;
    expect(_typed.type).toBe('palm');
  });
});

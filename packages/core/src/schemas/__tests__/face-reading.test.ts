import { describe, it, expect } from 'vitest';
import { FaceReadingResultSchema } from '../face-reading';

const validData = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  type: 'face' as const,
  fortune: {
    title: '面相总运',
    content: '你的面相显示近期运势平稳。',
    score: 75,
  },
  career: {
    title: '事业运',
    content: '额头饱满，事业运势良好。',
    score: 82,
  },
  relationship: {
    title: '感情运',
    content: '眉眼和谐，感情运势顺遂。',
    score: 88,
  },
  wisdom: {
    title: '智慧运',
    content: '印堂开阔，思维敏捷。',
    score: 91,
  },
  overallScore: 84,
  summary: '综合面相分析，运势良好。',
  createdAt: '2026-04-29T00:00:00.000Z',
};

describe('FaceReadingResultSchema', () => {
  it('parses valid data without errors', () => {
    const result = FaceReadingResultSchema.parse(validData);
    expect(result.id).toBe(validData.id);
    expect(result.type).toBe('face');
    expect(result.fortune.score).toBe(75);
    expect(result.overallScore).toBe(84);
  });

  it('rejects data with missing required field', () => {
    const { fortune: _fortune, ...missingField } = validData;
    expect(() => FaceReadingResultSchema.parse(missingField)).toThrow();
  });

  it('rejects data with wrong type', () => {
    const wrongType = { ...validData, type: 'palm' };
    expect(() => FaceReadingResultSchema.parse(wrongType)).toThrow();
  });

  it('rejects data with invalid overallScore', () => {
    const outOfRange = { ...validData, overallScore: 200 };
    expect(() => FaceReadingResultSchema.parse(outOfRange)).toThrow();
  });

  it('rejects malformed data (non-uuid id)', () => {
    const badId = { ...validData, id: 'not-a-uuid' };
    expect(() => FaceReadingResultSchema.parse(badId)).toThrow();
  });
});

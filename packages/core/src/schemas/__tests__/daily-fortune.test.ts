import { describe, it, expect } from 'vitest';
import { DailyFortuneResultSchema } from '../daily-fortune';

const validData = {
  date: '2026-04-29',
  overall: { score: 80, text: '今日运势良好，适合处理重要事务。' },
  love: { score: 75, text: '感情运势平稳。' },
  career: { score: 85, text: '事业运势上升。' },
  wealth: { score: 70, text: '财运一般，谨慎投资。' },
  luckyNumber: 7,
  luckyColor: '紫色',
  summary: '整体运势不错，把握机会。',
};

describe('DailyFortuneResultSchema', () => {
  it('parses valid data without errors', () => {
    const result = DailyFortuneResultSchema.parse(validData);
    expect(result.date).toBe('2026-04-29');
    expect(result.overall.score).toBe(80);
    expect(result.luckyNumber).toBe(7);
  });

  it('rejects data with missing required field', () => {
    const { love: _love, ...missingField } = validData;
    expect(() => DailyFortuneResultSchema.parse(missingField)).toThrow();
  });

  it('rejects score out of range (love.score > 100)', () => {
    const badScore = { ...validData, love: { score: 150, text: '超好运' } };
    expect(() => DailyFortuneResultSchema.parse(badScore)).toThrow();
  });

  it('rejects non-integer luckyNumber', () => {
    const badNumber = { ...validData, luckyNumber: 7.5 };
    expect(() => DailyFortuneResultSchema.parse(badNumber)).toThrow();
  });

  it('rejects extra fields (strict mode)', () => {
    const extra = { ...validData, unknown: 'field' };
    expect(() => DailyFortuneResultSchema.parse(extra)).toThrow();
  });
});

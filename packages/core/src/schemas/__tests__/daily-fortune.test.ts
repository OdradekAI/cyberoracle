import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { DailyFortuneResultSchema } from '../daily-fortune';

const standardAnswer = {
  title: '今日心境速写',
  date: '2025年1月15日',
  ganzhi: '甲子日',
  solarTerm: '小寒',
  ratings: {
    overall: 4,
    work: 4,
    relationship: 3,
    creative: 5,
    rest: 4,
  },
  lucky: {
    color: '雾蓝',
    direction: '东南',
    number: 3,
    moment: '上午十点前后',
  },
  advice: {
    do: '适合整理思路、写下未完成的想法，今天的灵感来得轻盈而清晰。',
    avoid: '不必急于做长期承诺，给重要决定多留一天的余地。',
  },
  oneLine: '今天适合让节奏慢半拍——不是停下，而是把心收回来，再走得更准一些。',
};

describe('DailyFortuneResultSchema', () => {
  it('validates the standard answer JSON from docs', () => {
    const result = DailyFortuneResultSchema.parse(standardAnswer);
    expect(result.title).toBe('今日心境速写');
    expect(result.date).toBe('2025年1月15日');
    expect(result.ratings.overall).toBe(4);
    expect(result.ratings.creative).toBe(5);
    expect(result.lucky.number).toBe(3);
    expect(result.advice.do).toContain('整理思路');
    expect(result.oneLine).toContain('慢半拍');
  });

  it('accepts empty solarTerm', () => {
    const data = { ...standardAnswer, solarTerm: '' };
    const result = DailyFortuneResultSchema.parse(data);
    expect(result.solarTerm).toBe('');
  });

  it('rejects ratings.overall = 6 (out of 1-5 range)', () => {
    const malformed = {
      ...standardAnswer,
      ratings: { ...standardAnswer.ratings, overall: 6 },
    };
    expect(() => DailyFortuneResultSchema.parse(malformed)).toThrow();
  });

  it('rejects ratings.overall = 0 (out of 1-5 range)', () => {
    const malformed = {
      ...standardAnswer,
      ratings: { ...standardAnswer.ratings, overall: 0 },
    };
    expect(() => DailyFortuneResultSchema.parse(malformed)).toThrow();
  });

  it('rejects lucky.number = 10 (out of 0-9 range)', () => {
    const malformed = {
      ...standardAnswer,
      lucky: { ...standardAnswer.lucky, number: 10 },
    };
    expect(() => DailyFortuneResultSchema.parse(malformed)).toThrow();
  });

  it('rejects missing ratings field', () => {
    const { ratings: _, ...missing } = standardAnswer;
    expect(() => DailyFortuneResultSchema.parse(missing)).toThrow();
  });

  it('rejects missing advice.do', () => {
    const malformed = {
      ...standardAnswer,
      advice: { avoid: 'test' },
    };
    expect(() => DailyFortuneResultSchema.parse(malformed)).toThrow();
  });

  it('accepts lucky.number = 0', () => {
    const data = {
      ...standardAnswer,
      lucky: { ...standardAnswer.lucky, number: 0 },
    };
    expect(DailyFortuneResultSchema.parse(data).lucky.number).toBe(0);
  });

  it('accepts lucky.number = 9', () => {
    const data = {
      ...standardAnswer,
      lucky: { ...standardAnswer.lucky, number: 9 },
    };
    expect(DailyFortuneResultSchema.parse(data).lucky.number).toBe(9);
  });

  it('exports inferred type', () => {
    type DailyFortune = z.infer<typeof DailyFortuneResultSchema>;
    const parsed: DailyFortune = DailyFortuneResultSchema.parse(standardAnswer);
    expect(parsed.title).toBe('今日心境速写');
  });
});

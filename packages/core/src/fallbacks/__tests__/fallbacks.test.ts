import { describe, it, expect } from 'vitest';
import { getPalmFallback, getFaceFallback, getDailyFallback, getCompanionLine } from '../index';
import {
  PalmReadingResultSchema,
  FaceReadingResultSchema,
  DailyFortuneResultSchema,
} from '../../schemas';

describe('fallbacks', () => {
  describe('getPalmFallback', () => {
    it('returns valid PalmReadingResult', () => {
      const fallback = getPalmFallback();
      const result = PalmReadingResultSchema.safeParse(fallback);
      expect(result.success).toBe(true);
    });

    it('contains 兜底 disclaimer', () => {
      const fallback = getPalmFallback();
      expect(fallback.disclaimer.body).toContain('兜底');
    });

    it('has cloud illustration', () => {
      const fallback = getPalmFallback();
      expect(fallback.summary.illustration).toBe('cloud');
    });
  });

  describe('getFaceFallback', () => {
    it('returns valid FaceReadingResult', () => {
      const fallback = getFaceFallback();
      const result = FaceReadingResultSchema.safeParse(fallback);
      expect(result.success).toBe(true);
    });

    it('contains 兜底 disclaimer', () => {
      const fallback = getFaceFallback();
      expect(fallback.disclaimer.body).toContain('兜底');
    });

    it('has cloud illustration', () => {
      const fallback = getFaceFallback();
      expect(fallback.summary.illustration).toBe('cloud');
    });
  });

  describe('getDailyFallback', () => {
    it('returns valid DailyFortuneResult', () => {
      const fallback = getDailyFallback();
      const result = DailyFortuneResultSchema.safeParse(fallback);
      expect(result.success).toBe(true);
    });

    it('has title 今日心境速写', () => {
      const fallback = getDailyFallback();
      expect(fallback.title).toBe('今日心境速写');
    });

    it('has moderate ratings (3-4)', () => {
      const fallback = getDailyFallback();
      const { ratings } = fallback;
      expect(ratings.overall).toBeGreaterThanOrEqual(3);
      expect(ratings.overall).toBeLessThanOrEqual(4);
    });
  });

  describe('getCompanionLine', () => {
    it('returns a non-empty string for morning', () => {
      const line = getCompanionLine('morning');
      expect(typeof line).toBe('string');
      expect(line.length).toBeGreaterThan(0);
    });

    it('returns a non-empty string for idle', () => {
      const line = getCompanionLine('idle');
      expect(typeof line).toBe('string');
      expect(line.length).toBeGreaterThan(0);
    });

    it('returns a non-empty string for tap', () => {
      const line = getCompanionLine('tap');
      expect(typeof line).toBe('string');
      expect(line.length).toBeGreaterThan(0);
    });

    it('returns a non-empty string for celebrate', () => {
      const line = getCompanionLine('celebrate');
      expect(typeof line).toBe('string');
      expect(line.length).toBeGreaterThan(0);
    });

    it('returns a non-empty string for sad', () => {
      const line = getCompanionLine('sad');
      expect(typeof line).toBe('string');
      expect(line.length).toBeGreaterThan(0);
    });

    it('returns different strings on repeated calls (randomized)', () => {
      const lines = new Set<string>();
      for (let i = 0; i < 20; i++) {
        lines.add(getCompanionLine('morning'));
      }
      expect(lines.size).toBeGreaterThan(1);
    });
  });
});

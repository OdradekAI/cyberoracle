import { describe, it, expect } from 'vitest';
import { fontFamilies, typeScale } from '../typography';
import { spacing } from '../spacing';
import { borderRadius } from '../borders';
import { easing, durations } from '../animations';

describe('typography tokens', () => {
  describe('fontFamilies', () => {
    it('has notoSerifSC and orbitron', () => {
      expect(fontFamilies.notoSerifSC).toBeDefined();
      expect(fontFamilies.orbitron).toBeDefined();
    });

    it('values are non-empty strings', () => {
      for (const [key, value] of Object.entries(fontFamilies) as [string, string][]) {
        expect(value.length, `${key} should be non-empty`).toBeGreaterThan(0);
      }
    });
  });

  describe('typeScale', () => {
    const sizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'] as const;

    it('has xs through 5xl sizes', () => {
      for (const size of sizes) {
        expect(typeScale[size], `typeScale.${size} should exist`).toBeDefined();
      }
    });

    it('each size has fontSize and lineHeight', () => {
      for (const [key, val] of Object.entries(typeScale) as [
        string,
        { fontSize: string; lineHeight: string },
      ][]) {
        expect(val.fontSize, `${key}.fontSize should be a string`).toBeTypeOf('string');
        expect(val.lineHeight, `${key}.lineHeight should be a string`).toBeTypeOf('string');
      }
    });
  });
});

describe('spacing tokens', () => {
  const expected = [0, 1, 2, 4, 8, 12, 16, 24, 32, 48, 64, 96] as const;

  it('has 0–96 step values', () => {
    for (const key of expected) {
      expect(spacing[key], `spacing.${key} should exist`).toBeDefined();
    }
  });

  it('values are strings with rem or px units', () => {
    const unitRegex = /^\d+(\.\d+)?(rem|px)$/;
    for (const [key, value] of Object.entries(spacing) as [string, string][]) {
      expect(value, `${key} = ${value} should have valid unit`).toMatch(unitRegex);
    }
  });
});

describe('border tokens', () => {
  it('has card, button, input radius values', () => {
    expect(borderRadius.card).toBe('16px');
    expect(borderRadius.button).toBe('12px');
    expect(borderRadius.input).toBe('10px');
  });
});

describe('animation tokens', () => {
  it('easing is a valid cubic-bezier', () => {
    expect(easing.default).toMatch(/^cubic-bezier\(/);
  });

  it('durations has enter and exit', () => {
    expect(durations.enter).toBe('360ms');
    expect(durations.exit).toBe('220ms');
  });
});

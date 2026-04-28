import { describe, it, expect } from 'vitest';
import { brandColors, darkColors, posterColors, semanticColors, allColors } from '../colors';

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

function assertAllHex(obj: Record<string, string>) {
  for (const [key, value] of Object.entries(obj)) {
    it(`${key} = ${value} is valid hex`, () => {
      expect(value).toMatch(HEX_REGEX);
    });
  }
}

describe('brandColors', () => {
  it('has purple, cyan, pink', () => {
    expect(brandColors.purple).toBe('#A855F7');
    expect(brandColors.cyan).toBe('#22D3EE');
    expect(brandColors.pink).toBe('#F472B6');
  });
  assertAllHex(brandColors);
});

describe('darkColors', () => {
  it('has dark background', () => {
    expect(darkColors.bg).toBe('#0B0420');
  });
  assertAllHex(darkColors);
});

describe('posterColors', () => {
  it('has cream, text, gold', () => {
    expect(posterColors.cream).toBe('#F8F5EE');
    expect(posterColors.text).toBe('#1F1B16');
    expect(posterColors.gold).toBe('#9A7B3F');
  });
  assertAllHex(posterColors);
});

describe('semanticColors', () => {
  it('has all required aliases', () => {
    expect(semanticColors.primary).toBeDefined();
    expect(semanticColors.secondary).toBeDefined();
    expect(semanticColors.accent).toBeDefined();
    expect(semanticColors.background).toBeDefined();
    expect(semanticColors.surface).toBeDefined();
    expect(semanticColors.text).toBeDefined();
  });
  assertAllHex(semanticColors);
});

describe('allColors', () => {
  it('contains brand, dark, poster, and semantic groups', () => {
    expect(allColors.brand).toBe(brandColors);
    expect(allColors.dark).toBe(darkColors);
    expect(allColors.poster).toBe(posterColors);
    expect(allColors.semantic).toBe(semanticColors);
  });
});

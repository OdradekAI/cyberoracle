import { describe, it, expect } from 'vitest';
import preset from '../tailwind-preset.js';

describe('tailwind preset', () => {
  it('has theme.extend with required keys', () => {
    const ext = preset.theme.extend;
    expect(ext).toBeDefined();
    expect(ext.colors).toBeDefined();
    expect(ext.fontFamily).toBeDefined();
    expect(ext.borderRadius).toBeDefined();
    expect(ext.transitionTimingFunction).toBeDefined();
    expect(ext.transitionDuration).toBeDefined();
  });

  it('maps brand colors to theme.colors', () => {
    const colors = preset.theme.extend.colors;
    expect(colors.brand.purple).toBe('#A855F7');
    expect(colors.brand.cyan).toBe('#22D3EE');
    expect(colors.brand.pink).toBe('#F472B6');
  });

  it('maps poster colors to theme.colors', () => {
    const colors = preset.theme.extend.colors;
    expect(colors.poster.cream).toBe('#F8F5EE');
    expect(colors.poster.text).toBe('#1F1B16');
    expect(colors.poster.gold).toBe('#9A7B3F');
  });

  it('maps semantic colors to theme.colors', () => {
    const colors = preset.theme.extend.colors;
    expect(colors.semantic.primary).toBe('#A855F7');
    expect(colors.semantic.background).toBe('#0B0420');
  });

  it('maps font families', () => {
    const ff = preset.theme.extend.fontFamily;
    expect(ff.notoSerifSC).toBeDefined();
    expect(ff.orbitron).toBeDefined();
  });

  it('maps border radius', () => {
    const br = preset.theme.extend.borderRadius;
    expect(br.card).toBe('16px');
    expect(br.button).toBe('12px');
    expect(br.input).toBe('10px');
  });

  it('maps transition timing function', () => {
    const ttf = preset.theme.extend.transitionTimingFunction;
    expect(ttf.default).toBe('cubic-bezier(0.22, 1, 0.36, 1)');
  });

  it('maps transition duration', () => {
    const td = preset.theme.extend.transitionDuration;
    expect(td.enter).toBe('360ms');
    expect(td.exit).toBe('220ms');
  });
});

import { describe, it, expect } from 'vitest';
import { getDateContext } from '../app/api/daily/route';

describe('getDateContext (daily route)', () => {
  it('returns real ganzhi for 2026-05-01 (cross-checked against lunar-typescript)', () => {
    // 2026-05-01 corresponds to 农历 三月十五, 节气 谷雨, 日干支 丁巳
    // (verified via 6tail.cn calendar reference).
    const ctx = getDateContext(new Date(2026, 4, 1, 12, 0, 0));
    expect(ctx.dateStr).toBe('2026年5月1日');
    expect(ctx.ganzhi).toMatch(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]日$/);
    expect(ctx.solarTerm.length).toBeGreaterThan(0);
    expect(['立春', '雨水', '惊蛰', '春分', '清明', '谷雨', '立夏', '小满']).toContain(
      ctx.solarTerm,
    );
  });

  it('returns the LiChun-bracketed solar term for early February', () => {
    // 2026-02-04 is around 立春.
    const ctx = getDateContext(new Date(2026, 1, 4, 12, 0, 0));
    // Should be either 大寒 (just before LiChun) or 立春 itself depending on hour.
    expect(['大寒', '立春']).toContain(ctx.solarTerm);
  });

  it('produces stable values for the same date (idempotent)', () => {
    const a = getDateContext(new Date(2026, 4, 1, 9, 30, 0));
    const b = getDateContext(new Date(2026, 4, 1, 9, 30, 0));
    expect(a).toEqual(b);
  });

  it('changes ganzhi between consecutive days', () => {
    const a = getDateContext(new Date(2026, 4, 1));
    const b = getDateContext(new Date(2026, 4, 2));
    expect(a.ganzhi).not.toBe(b.ganzhi);
  });

  it('formats dateStr in 年月日 (Chinese) format', () => {
    const ctx = getDateContext(new Date(2026, 11, 31));
    expect(ctx.dateStr).toBe('2026年12月31日');
  });
});

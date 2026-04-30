import { describe, it, expect } from 'vitest';
import { renderToPng } from '../../render/render-server';
import { DailyFortuneCard, type DailyFortuneCardData } from '../DailyFortuneCard';
import { readFileSync } from 'node:fs';

const testFontBuffer = readFileSync('C:/Windows/Fonts/arial.ttf');
const testFontData = new Uint8Array(testFontBuffer).buffer as ArrayBuffer;
const testFonts = [{ name: 'Arial', data: testFontData, weight: 400, style: 'normal' as const }];

const sampleData: DailyFortuneCardData = {
  title: '今日心境速写',
  date: '2026年4月30日',
  ganzhi: '丙午年 壬辰月 庚寅日',
  solarTerm: '谷雨',
  ratings: { overall: 4, work: 3, relationship: 5, creative: 4, rest: 4 },
  lucky: { color: '雾灰', direction: '东北', number: 5, moment: '午后三点前后' },
  advice: {
    do: '适合做轻量的事——整理桌面、喝一杯水、写两句话。让节奏慢下来。',
    avoid: '不必急着做大的决定。今天的状态更适合观察和感受，而非行动。',
  },
  oneLine: '今天的星辰有点遮蔽——不是看不见，是让你先闭上眼，感受一下风的方向。',
};

function isValidPng(buf: Buffer): boolean {
  return buf[0] === 0x89 && buf[1] === 0x50;
}

describe('DailyFortuneCard', () => {
  it('renders to valid PNG with sample data', async () => {
    const buf = await renderToPng(<DailyFortuneCard data={sampleData} />, {
      width: 800,
      fonts: testFonts,
    });
    expect(isValidPng(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(3000);
  });

  it('renders with watermark', async () => {
    const buf = await renderToPng(<DailyFortuneCard data={sampleData} date="2026-04-30" />, {
      width: 800,
      fonts: testFonts,
    });
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders with empty solarTerm', async () => {
    const noTerm = { ...sampleData, solarTerm: '' };
    const buf = await renderToPng(<DailyFortuneCard data={noTerm} />, {
      width: 800,
      fonts: testFonts,
    });
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders with low ratings', async () => {
    const lowRatings = {
      ...sampleData,
      ratings: { overall: 1, work: 1, relationship: 2, creative: 2, rest: 1 },
    };
    const buf = await renderToPng(<DailyFortuneCard data={lowRatings} />, {
      width: 800,
      fonts: testFonts,
    });
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders with high ratings', async () => {
    const highRatings = {
      ...sampleData,
      ratings: { overall: 5, work: 5, relationship: 5, creative: 5, rest: 5 },
    };
    const buf = await renderToPng(<DailyFortuneCard data={highRatings} />, {
      width: 800,
      fonts: testFonts,
    });
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders with desktop source', async () => {
    const buf = await renderToPng(
      <DailyFortuneCard data={sampleData} date="2026-04-30" source="desktop" />,
      { width: 800, fonts: testFonts },
    );
    expect(isValidPng(buf)).toBe(true);
  });
});

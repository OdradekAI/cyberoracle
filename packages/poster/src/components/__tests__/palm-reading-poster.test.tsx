import { describe, it, expect } from 'vitest';
import { renderToPng } from '../../render/render-server';
import { PalmReadingPoster, type PalmReadingPosterData } from '../PalmReadingPoster';
import { readFileSync } from 'node:fs';

const testFontBuffer = readFileSync('C:/Windows/Fonts/arial.ttf');
const testFontData = new Uint8Array(testFontBuffer).buffer as ArrayBuffer;
const testFonts = [{ name: 'Arial', data: testFontData, weight: 400, style: 'normal' as const }];

const sampleData: PalmReadingPosterData = {
  meta: {
    title: '手相解读指南',
    subtitle: '根据你的掌纹与手型做的简洁分析',
  },
  overview: {
    heading: '掌纹总览',
    body: '你的掌纹整体偏清晰，主线分布有层次，说明你做事讲逻辑，也重视实际感受。智慧线较突出，代表思考投入度高。',
  },
  mainLines: [
    {
      name: '感情线',
      icon: 'heart',
      body: '感情线位置较平稳，说明你情感表达偏克制，重视关系中的信任感与稳定度。',
    },
    {
      name: '智慧线',
      icon: 'brain',
      body: '智慧线较长并向掌心下方微斜延伸，代表思考细致，观察力较强。',
    },
    { name: '生命线', icon: 'leaf', body: '生命线弧度完整，延伸较长，通常象征耐力与恢复力不错。' },
  ],
  auxiliary: [
    {
      icon: 'signpost',
      label: '命运线偏淡但可见',
      body: '更适合在实践中逐渐明确方向，职业路径往往靠持续积累形成。',
    },
    { icon: 'wave', label: '细纹分布适中', body: '说明你对外界变化有感知力，也容易进入思考状态。' },
  ],
  temperament: {
    heading: '手型气质',
    body: '从手型看，掌底偏宽厚，拇指有张力，给人的印象偏务实、直接、可靠。',
  },
  summary: {
    heading: '综合解读',
    body: '这是一只偏"稳步推进型"的手。你在思考上认真，在行动上讲节奏，在关系里看重长期感受。价值往往来自时间累积，而不是短期起伏。',
    illustration: 'mountain',
  },
  disclaimer: {
    label: '阅读提示',
    body: '手相更适合作为观察自我倾向的一种有趣视角，可把它当作个性与状态的轻量参考。',
  },
};

function isValidPng(buf: Buffer): boolean {
  return buf[0] === 0x89 && buf[1] === 0x50;
}

describe('PalmReadingPoster', () => {
  it('renders to valid PNG with sample data', async () => {
    const buf = await renderToPng(<PalmReadingPoster data={sampleData} />, {
      width: 800,
      fonts: testFonts,
    });
    expect(isValidPng(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(5000);
  });

  it('renders with watermark date', async () => {
    const buf = await renderToPng(<PalmReadingPoster data={sampleData} date="2026-04-30" />, {
      width: 800,
      fonts: testFonts,
    });
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders with QR data URL', async () => {
    const buf = await renderToPng(
      <PalmReadingPoster
        data={sampleData}
        date="2026-04-30"
        qrDataUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
      />,
      { width: 800, fonts: testFonts },
    );
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders with cloud illustration', async () => {
    const cloudData = {
      ...sampleData,
      summary: { ...sampleData.summary, illustration: 'cloud' as const },
    };
    const buf = await renderToPng(<PalmReadingPoster data={cloudData} />, {
      width: 800,
      fonts: testFonts,
    });
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders with river illustration', async () => {
    const riverData = {
      ...sampleData,
      summary: { ...sampleData.summary, illustration: 'river' as const },
    };
    const buf = await renderToPng(<PalmReadingPoster data={riverData} />, {
      width: 800,
      fonts: testFonts,
    });
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders with lotus illustration', async () => {
    const lotusData = {
      ...sampleData,
      summary: { ...sampleData.summary, illustration: 'lotus' as const },
    };
    const buf = await renderToPng(<PalmReadingPoster data={lotusData} />, {
      width: 800,
      fonts: testFonts,
    });
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders with 3 auxiliary items', async () => {
    const data3 = {
      ...sampleData,
      auxiliary: [
        ...sampleData.auxiliary,
        { icon: 'signpost' as const, label: '第三观察', body: '额外的一条辅助观察。' },
      ],
    };
    const buf = await renderToPng(<PalmReadingPoster data={data3} />, {
      width: 800,
      fonts: testFonts,
    });
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders desktop source variant', async () => {
    const buf = await renderToPng(
      <PalmReadingPoster data={sampleData} date="2026-04-30" source="desktop" />,
      { width: 800, fonts: testFonts },
    );
    expect(isValidPng(buf)).toBe(true);
  });
});

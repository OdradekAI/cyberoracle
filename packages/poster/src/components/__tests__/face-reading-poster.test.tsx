import { describe, it, expect } from 'vitest';
import { renderToPng } from '../../render/render-server';
import { FaceReadingPoster, type FaceReadingPosterData } from '../FaceReadingPoster';
import { readFileSync } from 'node:fs';

const testFontBuffer = readFileSync('C:/Windows/Fonts/arial.ttf');
const testFontData = new Uint8Array(testFontBuffer).buffer as ArrayBuffer;
const testFonts = [{ name: 'Arial', data: testFontData, weight: 400, style: 'normal' as const }];

const sampleData: FaceReadingPosterData = {
  meta: {
    title: '面相解读指南',
    subtitle: '根据你的面部特征做的简洁分析',
  },
  overview: {
    heading: '五官总览',
    body: '你的面部轮廓清晰，五官分布均衡，整体给人的感觉是沉稳、内敛。眉眼间距适中，代表思考与行动之间有良好的节奏感。',
  },
  mainLines: [
    {
      name: '眉眼',
      icon: 'eyebrow',
      body: '眉毛浓淡适中，眉形偏平直，说明你处事稳重。眼神清澈，有观察力。',
    },
    { name: '鼻子', icon: 'nose', body: '鼻梁挺直，鼻头圆润，代表你做事有条理，也重视实际感受。' },
    { name: '嘴部', icon: 'mouth', body: '嘴唇厚薄适中，嘴角微微上扬，给人一种温和亲切的印象。' },
  ],
  auxiliary: [
    {
      icon: 'signpost',
      label: '今日能量略低',
      body: '不必急着确定方向。模糊本身也是一种状态，让它自己沉淀。',
    },
    {
      icon: 'wave',
      label: '能量正在回升',
      body: '不是每一次都需要看清全貌。有时候，先走一小步就够了。',
    },
  ],
  temperament: {
    heading: '面部气质',
    body: '从面相看，额头饱满，下颌线条清晰，给人的印象偏沉稳、有主见。你通常有自己的判断标准。',
  },
  summary: {
    heading: '综合解读',
    body: '这是一张"沉稳内蕴型"的面相。你在思考上深入，在表达上克制，在行动上稳健。对你来说，内在的笃定比外在的张扬更重要。',
    illustration: 'river',
  },
  disclaimer: {
    label: '阅读提示',
    body: '面相更适合作为了解自己的一种有趣视角，可把它当作个性与状态的轻量参考。',
  },
};

function isValidPng(buf: Buffer): boolean {
  return buf[0] === 0x89 && buf[1] === 0x50;
}

describe('FaceReadingPoster', () => {
  it('renders to valid PNG with sample data', async () => {
    const buf = await renderToPng(<FaceReadingPoster data={sampleData} />, {
      width: 800,
      fonts: testFonts,
    });
    expect(isValidPng(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(5000);
  });

  it('renders with watermark date', async () => {
    const buf = await renderToPng(<FaceReadingPoster data={sampleData} date="2026-04-30" />, {
      width: 800,
      fonts: testFonts,
    });
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders with QR data URL', async () => {
    const buf = await renderToPng(
      <FaceReadingPoster
        data={sampleData}
        date="2026-04-30"
        qrDataUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
      />,
      { width: 800, fonts: testFonts },
    );
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders with 4 mainLines', async () => {
    const data4 = {
      ...sampleData,
      mainLines: [
        ...sampleData.mainLines,
        { name: '脸型', icon: 'face' as const, body: '脸型偏方圆，给人一种稳重可靠的感觉。' },
      ],
    };
    const buf = await renderToPng(<FaceReadingPoster data={data4} />, {
      width: 800,
      fonts: testFonts,
    });
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders with mountain illustration', async () => {
    const mountainData = {
      ...sampleData,
      summary: { ...sampleData.summary, illustration: 'mountain' as const },
    };
    const buf = await renderToPng(<FaceReadingPoster data={mountainData} />, {
      width: 800,
      fonts: testFonts,
    });
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders with cloud illustration', async () => {
    const cloudData = {
      ...sampleData,
      summary: { ...sampleData.summary, illustration: 'cloud' as const },
    };
    const buf = await renderToPng(<FaceReadingPoster data={cloudData} />, {
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
    const buf = await renderToPng(<FaceReadingPoster data={lotusData} />, {
      width: 800,
      fonts: testFonts,
    });
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders desktop source variant', async () => {
    const buf = await renderToPng(
      <FaceReadingPoster data={sampleData} date="2026-04-30" source="desktop" />,
      { width: 800, fonts: testFonts },
    );
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
    const buf = await renderToPng(<FaceReadingPoster data={data3} />, {
      width: 800,
      fonts: testFonts,
    });
    expect(isValidPng(buf)).toBe(true);
  });
});

import { describe, it, expect } from 'vitest';
import { buildResultSections } from '../build';
import type { PalmReadingResult, FaceReadingResult } from '../../schemas';

function makeValidPalm(): PalmReadingResult {
  return {
    meta: { title: '手相解读指南', subtitle: '简洁手相分析' },
    overview: { heading: '掌纹总览', body: '掌纹整体清晰，做事讲逻辑。' },
    mainLines: [
      { name: '感情线', icon: 'heart', body: '感情线平稳。' },
      { name: '智慧线', icon: 'brain', body: '智慧线较长。' },
      { name: '生命线', icon: 'leaf', body: '生命线弧度完整。' },
    ],
    auxiliary: [
      { icon: 'signpost', label: '命运线偏淡', body: '方向慢慢明确。' },
      { icon: 'wave', label: '细纹分布适中', body: '感知力良好。' },
    ],
    temperament: { heading: '手型气质', body: '掌底偏宽厚，务实。' },
    summary: { heading: '综合解读', body: '稳步推进型。', illustration: 'mountain' },
    disclaimer: { label: '阅读提示', body: '仅供观察自我倾向。' },
  };
}

function makeValidFace(): FaceReadingResult {
  return {
    meta: { title: '面相解读指南', subtitle: '简洁面相分析' },
    overview: { heading: '五官总览', body: '五官协调，线条柔和。' },
    mainLines: [
      { name: '眉眼', icon: 'eye', body: '眼神平静而清晰。' },
      { name: '鼻子', icon: 'nose', body: '鼻梁挺直，做事有标准。' },
      { name: '嘴部', icon: 'mouth', body: '嘴角平缓，表达克制。' },
    ],
    auxiliary: [
      { icon: 'signpost', label: '额头饱满', body: '思考周全。' },
      { icon: 'wave', label: '表情温和', body: '情绪稳定。' },
    ],
    temperament: { heading: '整体气质', body: '内敛而稳。' },
    summary: { heading: '综合解读', body: '沉稳型。', illustration: 'mountain' },
    disclaimer: { label: '阅读提示', body: '仅供观察自我倾向。' },
  };
}

describe('buildResultSections', () => {
  it('maps a valid palm reading to all six section groups in order', () => {
    const sections = buildResultSections('palm', makeValidPalm());
    expect(sections).not.toBeNull();
    // 1 overview + 3 mainLines + 2 auxiliary + 1 temperament + 1 summary + 1 disclaimer = 9
    expect(sections).toHaveLength(9);
    expect(sections![0]!.title).toBe('掌纹总览');
    expect(sections![0]!.content).toContain('讲逻辑');
    expect(sections![1]!.title).toBe('感情线');
    expect(sections![3]!.title).toBe('生命线');
    expect(sections![4]!.title).toBe('命运线偏淡');
    expect(sections![6]!.title).toBe('手型气质');
    expect(sections![7]!.title).toBe('综合解读');
    expect(sections![8]!.title).toBe('阅读提示');
  });

  it('maps a valid face reading to all six section groups', () => {
    const sections = buildResultSections('face', makeValidFace());
    expect(sections).not.toBeNull();
    expect(sections).toHaveLength(9);
    expect(sections![1]!.title).toBe('眉眼');
    expect(sections![6]!.title).toBe('整体气质');
    expect(sections![7]!.title).toBe('综合解读');
  });

  it('returns null when overview is missing (schema fail → caller falls back to stub)', () => {
    const palm = makeValidPalm() as Partial<PalmReadingResult>;
    delete palm.overview;
    expect(buildResultSections('palm', palm)).toBeNull();
  });

  it('returns null when mainLines violates 3-item constraint', () => {
    const palm = makeValidPalm();
    palm.mainLines = palm.mainLines.slice(0, 2);
    expect(buildResultSections('palm', palm)).toBeNull();
  });

  it('returns null when payload is the legacy {label,content} shape (audit bug repro)', () => {
    const legacyShape = {
      overview: 'flat string',
      mainLines: [{ label: '事业运', content: '...' }],
      summary: 'flat string',
    };
    expect(buildResultSections('palm', legacyShape)).toBeNull();
  });

  it('preserves disclaimer body verbatim through to the last section', () => {
    const palm = makeValidPalm();
    palm.disclaimer.body = '这是一段非常重要的阅读提示，必须原样透传。';
    const sections = buildResultSections('palm', palm)!;
    expect(sections[sections.length - 1]!.title).toBe('阅读提示');
    expect(sections[sections.length - 1]!.content).toBe(palm.disclaimer.body);
  });

  it('returns null for null/undefined/non-object payload', () => {
    expect(buildResultSections('palm', null)).toBeNull();
    expect(buildResultSections('palm', undefined)).toBeNull();
    expect(buildResultSections('face', 'not an object')).toBeNull();
    expect(buildResultSections('palm', 42)).toBeNull();
  });
});

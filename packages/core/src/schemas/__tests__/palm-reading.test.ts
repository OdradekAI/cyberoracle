import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { PalmReadingResultSchema } from '../palm-reading';

const standardAnswer = {
  meta: {
    title: '手相解读指南',
    subtitle: '根据你的掌纹与手型做的简洁分析',
  },
  overview: {
    heading: '掌纹总览',
    body: '你的掌纹整体偏清晰，主线分布有层次，说明你做事讲逻辑，也重视实际感受。智慧线较突出，代表思考投入度高，遇事倾向于先判断再行动。生命线连贯而长，整体给人的感觉是稳、耐心、能持续。',
  },
  mainLines: [
    {
      name: '感情线',
      icon: 'heart',
      body: '感情线位置较平稳，线条偏细，说明你情感表达偏克制，重视关系中的信任感与稳定度。你通常不会轻易外露情绪，更看重长期相处是否舒服、可靠。',
    },
    {
      name: '智慧线',
      icon: 'brain',
      body: '智慧线较长，并向掌心下方微斜延伸，代表思考细致，观察力较强，也带一点想象力。你处理问题时往往会先建立判断框架，再逐步推进，适合做需要分析与耐心的事。',
    },
    {
      name: '生命线',
      icon: 'leaf',
      body: '生命线弧度完整，延伸较长，通常象征耐力与恢复力不错。你的做事方式更像持续推进型，不急着一冲到最前面，但节奏稳，越往后越能看出韧性。',
    },
  ],
  auxiliary: [
    {
      icon: 'signpost',
      label: '命运线偏淡但可见',
      body: '更适合在实践中逐渐明确方向，职业路径往往靠持续积累形成，不一定一开始就很明确，但会越做越清楚。',
    },
    {
      icon: 'wave',
      label: '细纹分布适中',
      body: '说明你对外界变化有感知力，也容易进入思考状态。好处是判断细，挑战是偶尔会想得比较多，需要给自己留一点行动空间。',
    },
  ],
  temperament: {
    heading: '手型气质',
    body: '从手型看，掌底偏宽厚，拇指有张力，手指整体较端正，给人的印象偏务实、直接、可靠。你通常有自己的判断标准，不太喜欢被随意打乱节奏，适合稳定深耕、持续投入的路径。',
  },
  summary: {
    heading: '综合解读',
    body: '这是一只偏「稳步推进型」的手。你在思考上认真，在行动上讲节奏，在关系里看重长期感受。你未必追求表面的张扬效率，但一旦确认方向，通常能持续往前，把事情做得更扎实。对你来说，价值往往来自时间累积，而不是短期起伏。',
    illustration: 'mountain',
  },
  disclaimer: {
    label: '阅读提示',
    body: '手相更适合作为观察自我倾向的一种有趣视角，可把它当作个性与状态的轻量参考。',
  },
};

describe('PalmReadingResultSchema', () => {
  it('validates the standard answer JSON from docs', () => {
    const result = PalmReadingResultSchema.parse(standardAnswer);
    expect(result.meta.title).toBe('手相解读指南');
    expect(result.overview.heading).toBe('掌纹总览');
    expect(result.mainLines).toHaveLength(3);
    expect(result.mainLines[0]!.icon).toBe('heart');
    expect(result.auxiliary).toHaveLength(2);
    expect(result.summary.illustration).toBe('mountain');
    expect(result.disclaimer.label).toBe('阅读提示');
  });

  it('rejects missing summary.illustration', () => {
    const { illustration: _, ...withoutIllustration } = standardAnswer.summary;
    const malformed = { ...standardAnswer, summary: withoutIllustration };
    expect(() => PalmReadingResultSchema.parse(malformed)).toThrow();
  });

  it('rejects missing meta field', () => {
    const { meta: _, ...missing } = standardAnswer;
    expect(() => PalmReadingResultSchema.parse(missing)).toThrow();
  });

  it('rejects empty mainLines', () => {
    const malformed = { ...standardAnswer, mainLines: [] };
    expect(() => PalmReadingResultSchema.parse(malformed)).toThrow();
  });

  it('rejects invalid mainLines icon', () => {
    const malformed = {
      ...standardAnswer,
      mainLines: [
        { name: '感情线', icon: 'invalid', body: 'test' },
        { name: '智慧线', icon: 'brain', body: 'test' },
        { name: '生命线', icon: 'leaf', body: 'test' },
      ],
    };
    expect(() => PalmReadingResultSchema.parse(malformed)).toThrow();
  });

  it('rejects invalid auxiliary icon', () => {
    const malformed = {
      ...standardAnswer,
      auxiliary: [{ icon: 'invalid', label: 'test', body: 'test' }],
    };
    expect(() => PalmReadingResultSchema.parse(malformed)).toThrow();
  });

  it('rejects invalid summary illustration', () => {
    const malformed = {
      ...standardAnswer,
      summary: { ...standardAnswer.summary, illustration: 'invalid' },
    };
    expect(() => PalmReadingResultSchema.parse(malformed)).toThrow();
  });

  it('validates with 3 auxiliary items', () => {
    const withThree = {
      ...standardAnswer,
      auxiliary: [
        ...standardAnswer.auxiliary,
        { icon: 'wave' as const, label: '第三项', body: '额外内容' },
      ],
    };
    const result = PalmReadingResultSchema.parse(withThree);
    expect(result.auxiliary).toHaveLength(3);
  });

  it('exports inferred type', () => {
    type PalmReading = z.infer<typeof PalmReadingResultSchema>;
    const parsed: PalmReading = PalmReadingResultSchema.parse(standardAnswer);
    expect(parsed.meta.title).toBe('手相解读指南');
  });
});

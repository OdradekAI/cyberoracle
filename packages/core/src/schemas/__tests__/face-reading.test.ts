import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { FaceReadingResultSchema } from '../face-reading';

const standardAnswer = {
  meta: {
    title: '面相解读指南',
    subtitle: '根据你的五官与气质做的简洁分析',
  },
  overview: {
    heading: '五官总览',
    body: '你的五官整体协调，线条偏柔和，给人的第一印象是温和、好相处。气场不张扬，更接近"内蕴型"——力量是收着的，不外显。这种面相在人群中往往让人感到安心，也容易获得长期的信任。',
  },
  mainLines: [
    {
      name: '眉眼',
      icon: 'eye',
      body: '眉毛走向自然，眉峰柔和；眼神平静而清晰，说明你性格偏沉稳，不容易被情绪冲击带跑。你看人看事会先观察一阵，再形成自己的判断，属于"看得清才说话"的类型。',
    },
    {
      name: '鼻子',
      icon: 'nose',
      body: '鼻梁挺直，鼻翼不宽，反映出你做事有自己的标准与节奏。你不太需要外界的认可来确认方向，内心有比较清晰的"应该怎么做"，是行动力安静但稳定的一类人。',
    },
    {
      name: '嘴部',
      icon: 'mouth',
      body: '嘴角自然平缓，唇形适中，说明你在表达上偏克制，不轻易承诺也不轻易否定。这样的人往往说出的话更经得起推敲，也容易在合作中给人可靠感。',
    },
    {
      name: '脸型',
      icon: 'face',
      body: '脸型偏椭圆，下颌线条柔和，下巴饱满清晰，整体气质既有亲和感也有底气。这种轮廓的人通常既能温和待人，又能在关键时刻坚持立场，是一种"柔中有韧"的状态。',
    },
  ],
  auxiliary: [
    {
      icon: 'signpost',
      label: '额头饱满方向感强',
      body: '说明你思考问题时较为周全，对长期目标有一定的规划意识。即使路径不一定一开始就清晰，你也愿意一步步把它走出来。',
    },
    {
      icon: 'wave',
      label: '整体表情温和',
      body: '反映你日常情绪比较稳定，是身边人愿意接近、愿意倾诉的那一类。你的存在感不靠张扬，靠的是相处之后的舒服。',
    },
  ],
  temperament: {
    heading: '整体气质',
    body: '你的气质是"内敛而稳"的类型——不抢眼但耐看，不喧哗但有分量。这种气场往往不靠初次见面打动人，而是在长期接触中慢慢显现：可靠、清晰、不浮躁。你适合需要积累的领域。',
  },
  summary: {
    heading: '综合解读',
    body: '这是一张偏「沉稳内蕴型」的脸。你性格里有一种安静的稳定感，思考清晰、表达克制、关系中重质不重量。你不一定是热闹场合里的中心，但常常是别人遇到事会想起的那个人。对你来说，长期的、深度的、有温度的连接，比短暂的高光更有意义。',
    illustration: 'mountain',
  },
  disclaimer: {
    label: '阅读提示',
    body: '面相更适合作为观察自我倾向的一种有趣视角，可把它当作个性与状态的轻量参考。',
  },
};

describe('FaceReadingResultSchema', () => {
  it('validates the standard answer JSON from docs', () => {
    const result = FaceReadingResultSchema.parse(standardAnswer);
    expect(result.meta.title).toBe('面相解读指南');
    expect(result.overview.heading).toBe('五官总览');
    expect(result.mainLines).toHaveLength(4);
    expect(result.mainLines[0]!.icon).toBe('eye');
    expect(result.auxiliary).toHaveLength(2);
    expect(result.summary.illustration).toBe('mountain');
    expect(result.disclaimer.label).toBe('阅读提示');
  });

  it('accepts 3 mainLines items', () => {
    const withThree = {
      ...standardAnswer,
      mainLines: standardAnswer.mainLines.slice(0, 3),
    };
    const result = FaceReadingResultSchema.parse(withThree);
    expect(result.mainLines).toHaveLength(3);
  });

  it('rejects fewer than 3 mainLines', () => {
    const malformed = {
      ...standardAnswer,
      mainLines: standardAnswer.mainLines.slice(0, 2),
    };
    expect(() => FaceReadingResultSchema.parse(malformed)).toThrow();
  });

  it('rejects more than 4 mainLines', () => {
    const malformed = {
      ...standardAnswer,
      mainLines: [
        ...standardAnswer.mainLines,
        { name: '额外', icon: 'nose' as const, body: 'test' },
      ],
    };
    expect(() => FaceReadingResultSchema.parse(malformed)).toThrow();
  });

  it('rejects invalid mainLines icon', () => {
    const malformed = {
      ...standardAnswer,
      mainLines: [
        { name: '眉眼', icon: 'heart', body: 'test' },
        ...standardAnswer.mainLines.slice(1),
      ],
    };
    expect(() => FaceReadingResultSchema.parse(malformed)).toThrow();
  });

  it('rejects invalid auxiliary icon', () => {
    const malformed = {
      ...standardAnswer,
      auxiliary: [{ icon: 'brain', label: 'test', body: 'test' }],
    };
    expect(() => FaceReadingResultSchema.parse(malformed)).toThrow();
  });

  it('rejects invalid summary illustration', () => {
    const malformed = {
      ...standardAnswer,
      summary: { ...standardAnswer.summary, illustration: 'ocean' },
    };
    expect(() => FaceReadingResultSchema.parse(malformed)).toThrow();
  });

  it('rejects missing meta', () => {
    const { meta: _, ...missing } = standardAnswer;
    expect(() => FaceReadingResultSchema.parse(missing)).toThrow();
  });

  it('exports inferred type', () => {
    type FaceReading = z.infer<typeof FaceReadingResultSchema>;
    const parsed: FaceReading = FaceReadingResultSchema.parse(standardAnswer);
    expect(parsed.meta.title).toBe('面相解读指南');
  });
});

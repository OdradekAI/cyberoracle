import { describe, it, expect } from 'vitest';
import { PalmObservationSchema, FaceObservationSchema } from '../vision-observation';

const validPalm = {
  valid: true,
  observations: {
    hand_shape: '掌部偏宽厚，整体方正',
    finger: '五指整齐，指节适中，拇指张力较好',
    palm_proportion: '掌部偏宽，与手指长度均衡',
    heart_line: '位置较平稳，线条偏细，弧度柔和',
    head_line: '较长，向掌心下方微斜延伸',
    life_line: '弧度完整，延伸较长，连贯清晰',
    fate_line: '较淡但可见，由掌底向上延伸',
    minor_lines: '细纹分布适中',
    skin_texture: '中等细腻',
    image_quality: '清晰，光线适当',
  },
};

const invalidPalm = { valid: false, reason: 'not_palm' as const };

const validFace = {
  valid: true,
  observations: {
    face_shape: '轮廓偏椭圆，下颌线条柔和',
    forehead: '额头适中，整体饱满',
    eyebrow: '眉毛走向自然，粗细中等，眉峰柔和',
    eye: '眼神平静，眼距适中',
    nose: '鼻梁挺直适中，鼻翼不宽',
    mouth: '嘴型适中，唇厚适中，嘴角自然平缓',
    chin: '下巴轮廓清晰，整体饱满',
    skin_texture: '中等细腻',
    expression_impression: '整体温和平静',
    image_quality: '清晰，光线适当',
  },
};

const invalidFace = { valid: false, reason: 'not_face' as const };

describe('PalmObservationSchema', () => {
  it('parses valid:true with all observation fields', () => {
    const result = PalmObservationSchema.parse(validPalm);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.observations.hand_shape).toBe('掌部偏宽厚，整体方正');
      expect(result.observations.image_quality).toBe('清晰，光线适当');
    }
  });

  it('parses valid:false with rejection reason', () => {
    const result = PalmObservationSchema.parse(invalidPalm);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('not_palm');
    }
  });

  it('accepts all palm rejection reasons', () => {
    for (const reason of ['not_palm', 'minor', 'low_quality', 'unsafe'] as const) {
      const result = PalmObservationSchema.parse({ valid: false, reason });
      expect(result.valid).toBe(false);
    }
  });

  it('rejects valid:true with missing observation field', () => {
    const { heart_line: _, ...missing } = validPalm.observations;
    expect(() => PalmObservationSchema.parse({ valid: true, observations: missing })).toThrow();
  });

  it('rejects valid:false with invalid reason', () => {
    expect(() => PalmObservationSchema.parse({ valid: false, reason: 'not_face' })).toThrow();
  });

  it('rejects object missing valid field', () => {
    expect(() => PalmObservationSchema.parse({ observations: validPalm.observations })).toThrow();
  });
});

describe('FaceObservationSchema', () => {
  it('parses valid:true with all observation fields', () => {
    const result = FaceObservationSchema.parse(validFace);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.observations.face_shape).toBe('轮廓偏椭圆，下颌线条柔和');
      expect(result.observations.expression_impression).toBe('整体温和平静');
    }
  });

  it('parses valid:false with rejection reason', () => {
    const result = FaceObservationSchema.parse(invalidFace);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe('not_face');
    }
  });

  it('accepts all face rejection reasons', () => {
    for (const reason of [
      'not_face',
      'minor',
      'multiple_faces',
      'low_quality',
      'unsafe',
    ] as const) {
      const result = FaceObservationSchema.parse({ valid: false, reason });
      expect(result.valid).toBe(false);
    }
  });

  it('rejects valid:true with missing observation field', () => {
    const { nose: _, ...missing } = validFace.observations;
    expect(() => FaceObservationSchema.parse({ valid: true, observations: missing })).toThrow();
  });

  it('rejects valid:false with invalid reason', () => {
    expect(() => FaceObservationSchema.parse({ valid: false, reason: 'not_palm' })).toThrow();
  });
});

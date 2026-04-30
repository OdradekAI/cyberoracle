import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generatePalmReading, generateFaceReading } from '../services/reading-service';

vi.mock('../lib/vlm-client', () => ({
  callVLM: vi.fn(),
  NoProviderAvailableError: class extends Error {},
}));

vi.mock('../lib/llm-stream-client', () => ({
  callLLMStream: vi.fn(),
  NoProviderAvailableError: class extends Error {},
}));

import { callVLM } from '../lib/vlm-client';
import { callLLMStream } from '../lib/llm-stream-client';

const mockCallVLM = vi.mocked(callVLM);
const mockCallLLMStream = vi.mocked(callLLMStream);

function makeValidPalmObservation(): string {
  return JSON.stringify({
    valid: true,
    observations: {
      hand_shape: '掌部偏宽厚',
      finger: '五指整齐',
      palm_proportion: '掌部偏宽',
      heart_line: '线条偏细',
      head_line: '较长',
      life_line: '弧度完整',
      fate_line: '较淡但可见',
      minor_lines: '细纹分布适中',
      skin_texture: '中等细腻',
      image_quality: '清晰',
    },
  });
}

function makeValidFaceObservation(): string {
  return JSON.stringify({
    valid: true,
    observations: {
      face_shape: '轮廓偏椭圆',
      forehead: '额头适中',
      eyebrow: '眉毛走向自然',
      eye: '眼神平静',
      nose: '鼻梁挺直',
      mouth: '嘴型适中',
      chin: '下巴轮廓清晰',
      skin_texture: '中等细腻',
      expression_impression: '温和平静',
      image_quality: '清晰',
    },
  });
}

function makeValidPalmReadingJSON(): string {
  return JSON.stringify({
    meta: { title: '手相解读指南', subtitle: '根据你的掌纹与手型做的简洁分析' },
    overview: { heading: '掌纹总览', body: '你的掌纹整体偏清晰，说明你做事讲逻辑。' },
    mainLines: [
      { name: '感情线', icon: 'heart', body: '感情线平稳，你情感表达偏克制。' },
      { name: '智慧线', icon: 'brain', body: '智慧线较长，思考细致。' },
      { name: '生命线', icon: 'leaf', body: '生命线弧度完整，耐力不错。' },
    ],
    auxiliary: [
      { icon: 'signpost', label: '命运线偏淡但可见', body: '适合在实践中逐渐明确方向。' },
      { icon: 'wave', label: '细纹分布适中', body: '对外界变化有感知力。' },
    ],
    temperament: { heading: '手型气质', body: '掌底偏宽厚，印象偏务实。' },
    summary: {
      heading: '综合解读',
      body: '这是一只偏「稳步推进型」的手。',
      illustration: 'mountain',
    },
    disclaimer: { label: '阅读提示', body: '手相更适合作为观察自我倾向的一种有趣视角。' },
  });
}

function makeValidFaceReadingJSON(): string {
  return JSON.stringify({
    meta: { title: '面相解读指南', subtitle: '根据你的五官与气质做的简洁分析' },
    overview: { heading: '五官总览', body: '你的五官整体协调，线条偏柔和。' },
    mainLines: [
      { name: '眉眼', icon: 'eye', body: '眼神平静而清晰。' },
      { name: '鼻子', icon: 'nose', body: '鼻梁挺直，做事有标准。' },
      { name: '嘴部', icon: 'mouth', body: '嘴角自然平缓，表达偏克制。' },
    ],
    auxiliary: [
      { icon: 'signpost', label: '额头饱满', body: '思考周全。' },
      { icon: 'wave', label: '表情温和', body: '情绪稳定。' },
    ],
    temperament: { heading: '整体气质', body: '气质内敛而稳。' },
    summary: { heading: '综合解读', body: '这是一张偏「沉稳型」的脸。', illustration: 'mountain' },
    disclaimer: { label: '阅读提示', body: '面相更适合作为观察自我倾向的一种有趣视角。' },
  });
}

describe('reading-service', () => {
  const dataUrl = 'data:image/png;base64,iVBORw0KGgo=';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generatePalmReading', () => {
    it('returns rejected when observation finds invalid image', async () => {
      mockCallVLM.mockResolvedValue(JSON.stringify({ valid: false, reason: 'not_palm' }));

      const result = await generatePalmReading(dataUrl);
      expect(result.status).toBe('rejected');
      if (result.status === 'rejected') {
        expect(result.reason).toBe('not_palm');
      }
    });

    it('returns rejected when observation reports minor', async () => {
      mockCallVLM.mockResolvedValue(JSON.stringify({ valid: false, reason: 'minor' }));

      const result = await generatePalmReading(dataUrl);
      expect(result.status).toBe('rejected');
      if (result.status === 'rejected') {
        expect(result.reason).toBe('minor');
      }
    });

    it('returns ok with valid palm reading result', async () => {
      mockCallVLM.mockResolvedValue(makeValidPalmObservation());

      async function* fakeStream() {
        yield makeValidPalmReadingJSON();
      }
      mockCallLLMStream.mockImplementation(fakeStream);

      const result = await generatePalmReading(dataUrl);
      expect(result.status).toBe('ok');
      if (result.status === 'ok') {
        expect(result.data.meta.title).toBe('手相解读指南');
        expect(result.data.mainLines).toHaveLength(3);
      }
    });

    it('calls onChunk callback with streaming chunks', async () => {
      mockCallVLM.mockResolvedValue(makeValidPalmObservation());

      async function* fakeStream() {
        yield '{"meta":';
        yield '{"title":"手相解读指南"';
        yield '}}';
      }
      mockCallLLMStream.mockImplementation(fakeStream);

      const chunks: string[] = [];
      await generatePalmReading(dataUrl, {
        onChunk: (chunk) => chunks.push(chunk),
      });

      expect(chunks).toEqual(['{"meta":', '{"title":"手相解读指南"', '}}']);
    });

    it('returns failed when VLM throws', async () => {
      mockCallVLM.mockRejectedValue(new Error('All providers failed'));

      const result = await generatePalmReading(dataUrl);
      expect(result.status).toBe('failed');
      if (result.status === 'failed') {
        expect(result.detail).toContain('providers failed');
      }
    });

    it('returns failed when LLM stream throws', async () => {
      mockCallVLM.mockResolvedValue(makeValidPalmObservation());

      async function* fakeStream() {
        yield 'partial';
        throw new Error('Stream broke');
      }
      mockCallLLMStream.mockImplementation(fakeStream);

      const result = await generatePalmReading(dataUrl);
      expect(result.status).toBe('failed');
    });

    it('returns failed when JSON parse fails', async () => {
      mockCallVLM.mockResolvedValue(makeValidPalmObservation());

      async function* fakeStream() {
        yield 'not valid json{{{';
      }
      mockCallLLMStream.mockImplementation(fakeStream);

      const result = await generatePalmReading(dataUrl);
      expect(result.status).toBe('failed');
    });

    it('returns failed when schema validation fails', async () => {
      mockCallVLM.mockResolvedValue(makeValidPalmObservation());

      async function* fakeStream() {
        yield JSON.stringify({ meta: { title: 'test' } });
      }
      mockCallLLMStream.mockImplementation(fakeStream);

      const result = await generatePalmReading(dataUrl);
      expect(result.status).toBe('failed');
    });
  });

  describe('generateFaceReading', () => {
    it('returns rejected when observation finds not_face', async () => {
      mockCallVLM.mockResolvedValue(JSON.stringify({ valid: false, reason: 'not_face' }));

      const result = await generateFaceReading(dataUrl);
      expect(result.status).toBe('rejected');
      if (result.status === 'rejected') {
        expect(result.reason).toBe('not_face');
      }
    });

    it('returns rejected when observation finds multiple_faces', async () => {
      mockCallVLM.mockResolvedValue(JSON.stringify({ valid: false, reason: 'multiple_faces' }));

      const result = await generateFaceReading(dataUrl);
      expect(result.status).toBe('rejected');
      if (result.status === 'rejected') {
        expect(result.reason).toBe('multiple_faces');
      }
    });

    it('returns ok with valid face reading result', async () => {
      mockCallVLM.mockResolvedValue(makeValidFaceObservation());

      async function* fakeStream() {
        yield makeValidFaceReadingJSON();
      }
      mockCallLLMStream.mockImplementation(fakeStream);

      const result = await generateFaceReading(dataUrl);
      expect(result.status).toBe('ok');
      if (result.status === 'ok') {
        expect(result.data.meta.title).toBe('面相解读指南');
        expect(result.data.mainLines.length).toBeGreaterThanOrEqual(3);
      }
    });
  });
});

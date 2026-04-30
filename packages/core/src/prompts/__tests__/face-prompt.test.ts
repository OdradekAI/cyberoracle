import { describe, it, expect } from 'vitest';
import { loadPrompt } from '../loader';

describe('vision-observe-face prompt', () => {
  it('loads successfully', () => {
    const prompt = loadPrompt('vision-observe-face');
    expect(prompt.meta.version).toBe('v1.1');
  });

  it('has correct outputFormat', () => {
    const prompt = loadPrompt('vision-observe-face');
    expect(prompt.meta.outputFormat).toBe('json');
  });

  it('has targetModel including qwen-vl-max', () => {
    const prompt = loadPrompt('vision-observe-face');
    expect(prompt.meta.targetModel).toContain('qwen-vl-max');
  });

  it('has system section with <<include:safety-rules>>', () => {
    const prompt = loadPrompt('vision-observe-face');
    expect(prompt.system).toContain('<<include:safety-rules>>');
  });

  it('system contains all 5 rejection reasons', () => {
    const prompt = loadPrompt('vision-observe-face');
    expect(prompt.system).toContain('not_face');
    expect(prompt.system).toContain('minor');
    expect(prompt.system).toContain('multiple_faces');
    expect(prompt.system).toContain('low_quality');
    expect(prompt.system).toContain('unsafe');
  });

  it('system contains all 10 observation fields', () => {
    const prompt = loadPrompt('vision-observe-face');
    expect(prompt.system).toContain('face_shape');
    expect(prompt.system).toContain('forehead');
    expect(prompt.system).toContain('eyebrow');
    expect(prompt.system).toContain('eye');
    expect(prompt.system).toContain('nose');
    expect(prompt.system).toContain('mouth');
    expect(prompt.system).toContain('chin');
    expect(prompt.system).toContain('skin_texture');
    expect(prompt.system).toContain('expression_impression');
    expect(prompt.system).toContain('image_quality');
  });

  it('has user template with photo instruction', () => {
    const prompt = loadPrompt('vision-observe-face');
    expect(prompt.userTemplate).toContain('面部照片');
    expect(prompt.userTemplate).toContain('JSON');
  });
});

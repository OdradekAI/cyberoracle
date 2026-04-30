import { describe, it, expect } from 'vitest';
import { loadPrompt, fillTemplate, expandIncludes } from '../loader';

describe('reading-write-face prompt', () => {
  it('loads successfully with correct version', () => {
    const prompt = loadPrompt('reading-write-face');
    expect(prompt.meta.version).toBe('v2.1');
  });

  it('has outputFormat json', () => {
    const prompt = loadPrompt('reading-write-face');
    expect(prompt.meta.outputFormat).toBe('json');
  });

  it('has targetModel including deepseek-v3', () => {
    const prompt = loadPrompt('reading-write-face');
    expect(prompt.meta.targetModel).toContain('deepseek-v3');
  });

  it('has maxTokens 1500', () => {
    const prompt = loadPrompt('reading-write-face');
    expect(prompt.meta.maxTokens).toBe(1500);
  });

  it('system includes <<include:safety-rules>> and <<include:tone-guidelines>>', () => {
    const prompt = loadPrompt('reading-write-face');
    expect(prompt.system).toContain('<<include:safety-rules>>');
    expect(prompt.system).toContain('<<include:tone-guidelines>>');
  });

  it('expandIncludes resolves both shared segments', async () => {
    const prompt = loadPrompt('reading-write-face');
    const expanded = await expandIncludes(prompt.system);
    expect(expanded).toContain('内容安全红线');
    expect(expanded).toContain('语气规范');
    expect(expanded).not.toContain('<<include:');
  });

  it('system contains 特别强调 section with 4 compliance points', () => {
    const prompt = loadPrompt('reading-write-face');
    expect(prompt.system).toContain('特别强调');
    expect(prompt.system).toContain('不评价美丑');
    expect(prompt.system).toContain('不预测健康');
    expect(prompt.system).toContain('不涉及姻缘事件');
    expect(prompt.system).toContain('性格倾向');
  });

  it('system contains output schema with face-specific fields', () => {
    const prompt = loadPrompt('reading-write-face');
    expect(prompt.system).toContain('面相解读指南');
    expect(prompt.system).toContain('五官总览');
    expect(prompt.system).toContain('整体气质');
    expect(prompt.system).toContain('mainLines');
    expect(prompt.system).toContain('auxiliary');
    expect(prompt.system).toContain('summary');
    expect(prompt.system).toContain('disclaimer');
  });

  it('system contains fixed face disclaimer text', () => {
    const prompt = loadPrompt('reading-write-face');
    expect(prompt.system).toContain('阅读提示');
    expect(prompt.system).toContain('面相更适合作为观察自我倾向的一种有趣视角');
  });

  it('system contains complete example output', () => {
    const prompt = loadPrompt('reading-write-face');
    expect(prompt.system).toContain('沉稳内蕴型');
  });

  it('user template contains {{observations}} variable', () => {
    const prompt = loadPrompt('reading-write-face');
    expect(prompt.userTemplate).toContain('{{observations}}');
  });

  it('fillTemplate substitutes observations correctly', () => {
    const prompt = loadPrompt('reading-write-face');
    const result = fillTemplate(prompt.userTemplate, {
      observations: '{"face_shape":"test"}',
    });
    expect(result).toContain('{"face_shape":"test"}');
    expect(result).not.toContain('{{observations}}');
  });
});

import { describe, it, expect } from 'vitest';
import { loadPrompt, fillTemplate, expandIncludes } from '../loader';

describe('reading-write-palm prompt', () => {
  it('loads successfully with correct version', () => {
    const prompt = loadPrompt('reading-write-palm');
    expect(prompt.meta.version).toBe('v3.1');
  });

  it('has outputFormat json', () => {
    const prompt = loadPrompt('reading-write-palm');
    expect(prompt.meta.outputFormat).toBe('json');
  });

  it('has targetModel including deepseek-v3', () => {
    const prompt = loadPrompt('reading-write-palm');
    expect(prompt.meta.targetModel).toContain('deepseek-v3');
  });

  it('has maxTokens 1500', () => {
    const prompt = loadPrompt('reading-write-palm');
    expect(prompt.meta.maxTokens).toBe(1500);
  });

  it('system includes <<include:safety-rules>> and <<include:tone-guidelines>>', () => {
    const prompt = loadPrompt('reading-write-palm');
    expect(prompt.system).toContain('<<include:safety-rules>>');
    expect(prompt.system).toContain('<<include:tone-guidelines>>');
  });

  it('expandIncludes resolves both shared segments', async () => {
    const prompt = loadPrompt('reading-write-palm');
    const expanded = await expandIncludes(prompt.system);
    expect(expanded).toContain('内容安全红线');
    expect(expanded).toContain('语气规范');
    expect(expanded).not.toContain('<<include:');
  });

  it('system contains required sections', () => {
    const prompt = loadPrompt('reading-write-palm');
    expect(prompt.system).toContain('【任务】');
    expect(prompt.system).toContain('【整体定位】');
    expect(prompt.system).toContain('【撰写原则】');
    expect(prompt.system).toContain('【输出 Schema');
    expect(prompt.system).toContain('【icon 选择规则】');
    expect(prompt.system).toContain('【输出要求】');
  });

  it('system contains fixed disclaimer text', () => {
    const prompt = loadPrompt('reading-write-palm');
    expect(prompt.system).toContain('阅读提示');
    expect(prompt.system).toContain('有趣视角');
  });

  it('system contains output schema fields', () => {
    const prompt = loadPrompt('reading-write-palm');
    expect(prompt.system).toContain('meta');
    expect(prompt.system).toContain('overview');
    expect(prompt.system).toContain('mainLines');
    expect(prompt.system).toContain('auxiliary');
    expect(prompt.system).toContain('temperament');
    expect(prompt.system).toContain('summary');
    expect(prompt.system).toContain('disclaimer');
    expect(prompt.system).toContain('illustration');
  });

  it('system contains both complete examples', () => {
    const prompt = loadPrompt('reading-write-palm');
    expect(prompt.system).toContain('稳步推进型');
    expect(prompt.system).toContain('敏感观察型');
  });

  it('user template contains {{observations}} variable', () => {
    const prompt = loadPrompt('reading-write-palm');
    expect(prompt.userTemplate).toContain('{{observations}}');
  });

  it('fillTemplate substitutes observations correctly', () => {
    const prompt = loadPrompt('reading-write-palm');
    const result = fillTemplate(prompt.userTemplate, {
      observations: '{"hand_shape":"test"}',
    });
    expect(result).toContain('{"hand_shape":"test"}');
    expect(result).not.toContain('{{observations}}');
  });
});

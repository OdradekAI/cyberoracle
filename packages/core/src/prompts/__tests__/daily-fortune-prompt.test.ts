import { describe, it, expect } from 'vitest';
import { loadPrompt, fillTemplate, expandIncludes } from '../loader';

describe('daily-fortune prompt', () => {
  it('loads successfully with correct version', () => {
    const prompt = loadPrompt('daily-fortune');
    expect(prompt.meta.version).toBe('v1.3');
  });

  it('has outputFormat json', () => {
    const prompt = loadPrompt('daily-fortune');
    expect(prompt.meta.outputFormat).toBe('json');
  });

  it('has targetModel including deepseek-v3', () => {
    const prompt = loadPrompt('daily-fortune');
    expect(prompt.meta.targetModel).toContain('deepseek-v3');
  });

  it('has targetModel including qwen-turbo', () => {
    const prompt = loadPrompt('daily-fortune');
    expect(prompt.meta.targetModel).toContain('qwen-turbo');
  });

  it('has temperature 0.8', () => {
    const prompt = loadPrompt('daily-fortune');
    expect(prompt.meta.temperature).toBe(0.8);
  });

  it('has maxTokens 500', () => {
    const prompt = loadPrompt('daily-fortune');
    expect(prompt.meta.maxTokens).toBe(500);
  });

  it('system includes <<include:safety-rules>> and <<include:tone-guidelines>>', () => {
    const prompt = loadPrompt('daily-fortune');
    expect(prompt.system).toContain('<<include:safety-rules>>');
    expect(prompt.system).toContain('<<include:tone-guidelines>>');
  });

  it('expandIncludes resolves both shared segments', async () => {
    const prompt = loadPrompt('daily-fortune');
    const expanded = await expandIncludes(prompt.system);
    expect(expanded).toContain('内容安全红线');
    expect(expanded).toContain('语气规范');
    expect(expanded).not.toContain('<<include:');
  });

  it('system contains 任务 section', () => {
    const prompt = loadPrompt('daily-fortune');
    expect(prompt.system).toContain('【任务】');
    expect(prompt.system).toContain('今日心境提醒');
  });

  it('system contains output schema fields', () => {
    const prompt = loadPrompt('daily-fortune');
    expect(prompt.system).toContain('今日心境速写');
    expect(prompt.system).toContain('ratings');
    expect(prompt.system).toContain('lucky');
    expect(prompt.system).toContain('advice');
    expect(prompt.system).toContain('oneLine');
  });

  it('system contains 撰写要求 section', () => {
    const prompt = loadPrompt('daily-fortune');
    expect(prompt.system).toContain('【撰写要求】');
    expect(prompt.system).toContain('ratings');
    expect(prompt.system).toContain('恐吓');
    expect(prompt.system).toContain('诗意');
  });

  it('system contains complete example output', () => {
    const prompt = loadPrompt('daily-fortune');
    expect(prompt.system).toContain('雾蓝');
    expect(prompt.system).toContain('甲子日');
    expect(prompt.system).toContain('小寒');
  });

  it('user template contains all 4 variables', () => {
    const prompt = loadPrompt('daily-fortune');
    expect(prompt.userTemplate).toContain('{{date}}');
    expect(prompt.userTemplate).toContain('{{ganzhi}}');
    expect(prompt.userTemplate).toContain('{{solarTerm}}');
    expect(prompt.userTemplate).toContain('{{seed}}');
  });

  it('fillTemplate substitutes all 4 variables correctly', () => {
    const prompt = loadPrompt('daily-fortune');
    const result = fillTemplate(prompt.userTemplate, {
      date: '2025年1月15日',
      ganzhi: '甲子',
      solarTerm: '小寒',
      seed: 'abc123',
    });
    expect(result).toContain('2025年1月15日');
    expect(result).toContain('甲子');
    expect(result).toContain('小寒');
    expect(result).toContain('abc123');
    expect(result).not.toContain('{{date}}');
    expect(result).not.toContain('{{ganzhi}}');
    expect(result).not.toContain('{{solarTerm}}');
    expect(result).not.toContain('{{seed}}');
  });
});

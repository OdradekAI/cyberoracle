import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { expandIncludes } from '../loader';

const sharedDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../../prompts/_shared');

describe('_shared/safety-rules.md', () => {
  const filePath = resolve(sharedDir, 'safety-rules.md');

  it('file exists', () => {
    expect(existsSync(filePath)).toBe(true);
  });

  it('is non-empty', async () => {
    const content = await readFile(filePath, 'utf-8');
    expect(content.trim().length).toBeGreaterThan(0);
  });

  it('contains 10-point safety checklist', async () => {
    const content = await readFile(filePath, 'utf-8');
    expect(content).toContain('内容安全红线');
    expect(content).toContain('寿命');
    expect(content).toContain('具体疾病');
    expect(content).toContain('具体金额');
    expect(content).toContain('种族');
  });

  it('contains 措辞要求 section', async () => {
    const content = await readFile(filePath, 'utf-8');
    expect(content).toContain('措辞要求');
    expect(content).toContain('倾向于');
  });

  it('contains 遇到无法处理的输入 section', async () => {
    const content = await readFile(filePath, 'utf-8');
    expect(content).toContain('无法处理的输入');
    expect(content).toContain('valid:false');
  });

  it('is resolvable via expandIncludes', async () => {
    const result = await expandIncludes('<<include:safety-rules>>');
    expect(result).toContain('内容安全红线');
  });
});

describe('_shared/tone-guidelines.md', () => {
  const filePath = resolve(sharedDir, 'tone-guidelines.md');

  it('file exists', () => {
    expect(existsSync(filePath)).toBe(true);
  });

  it('is non-empty', async () => {
    const content = await readFile(filePath, 'utf-8');
    expect(content.trim().length).toBeGreaterThan(0);
  });

  it('contains 整体定位 section', async () => {
    const content = await readFile(filePath, 'utf-8');
    expect(content).toContain('语气规范');
    expect(content).toContain('温和');
  });

  it('contains 风格关键词 section', async () => {
    const content = await readFile(filePath, 'utf-8');
    expect(content).toContain('风格关键词');
    expect(content).toContain('占卜师');
  });

  it('contains 具体写作要求 section', async () => {
    const content = await readFile(filePath, 'utf-8');
    expect(content).toContain('写作要求');
  });

  it('contains 中文表达细节 section', async () => {
    const content = await readFile(filePath, 'utf-8');
    expect(content).toContain('中文表达细节');
  });

  it('is resolvable via expandIncludes', async () => {
    const result = await expandIncludes('<<include:tone-guidelines>>');
    expect(result).toContain('语气规范');
  });
});

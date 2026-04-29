import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const promptPath = resolve(__dirname, '../../../prompts/vision-observe-palm.md');
const content = readFileSync(promptPath, 'utf-8');

describe('vision-observe-palm.md prompt file', () => {
  it('has YAML frontmatter with required fields', () => {
    expect(content.startsWith('---\n')).toBe(true);
    const frontmatterEnd = content.indexOf('---', 3);
    expect(frontmatterEnd).toBeGreaterThan(0);
    const frontmatter = content.slice(3, frontmatterEnd);
    expect(frontmatter).toContain('version:');
    expect(frontmatter).toContain('targetModel:');
    expect(frontmatter).toContain('temperature:');
    expect(frontmatter).toContain('description:');
  });

  it('has ---USER--- separator', () => {
    expect(content).toContain('---USER---');
  });

  it('has system prompt section before ---USER---', () => {
    const userIndex = content.indexOf('---USER---');
    const afterFrontmatter = content.indexOf('---', 3) + 3;
    const systemSection = content.slice(afterFrontmatter, userIndex);
    expect(systemSection.trim().length).toBeGreaterThan(0);
  });

  it('uses {{variable}} template syntax in user prompt', () => {
    const userIndex = content.indexOf('---USER---');
    const userSection = content.slice(userIndex + '---USER---'.length);
    expect(userSection).toMatch(/\{\{[\w]+\}\}/);
  });

  it('instructs VLM to return structured JSON', () => {
    expect(content.toLowerCase()).toContain('json');
  });
});

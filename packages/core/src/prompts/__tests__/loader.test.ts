import { describe, it, expect } from 'vitest';
import { loadPrompt, fillTemplate } from '../loader';

describe('fillTemplate', () => {
  it('replaces {{variable}} with provided value', () => {
    expect(fillTemplate('Hello {{name}}', { name: 'World' })).toBe('Hello World');
  });

  it('leaves {{variable}} unchanged when no matching key is provided', () => {
    expect(fillTemplate('Hello {{name}}', {})).toBe('Hello {{name}}');
  });

  it('replaces multiple different variables', () => {
    const template = '{{greeting}} {{name}}, {{message}}';
    expect(fillTemplate(template, { greeting: 'Hi', name: 'Alice', message: 'welcome!' })).toBe(
      'Hi Alice, welcome!',
    );
  });

  it('replaces repeated occurrences of the same variable', () => {
    expect(fillTemplate('{{x}} and {{x}}', { x: 'OK' })).toBe('OK and OK');
  });
});

describe('loadPrompt', () => {
  it('loads vision-observe-palm prompt with correct structure', () => {
    const result = loadPrompt('vision-observe-palm');

    expect(result).toHaveProperty('meta');
    expect(result).toHaveProperty('system');
    expect(result).toHaveProperty('userTemplate');

    expect(result.meta).toEqual({
      version: '1.0',
      targetModel: 'qwen-vl-max',
      temperature: 0.3,
    });

    expect(result.system.length).toBeGreaterThan(0);
    expect(result.userTemplate.length).toBeGreaterThan(0);
  });

  it('system section contains palm observation instructions', () => {
    const { system } = loadPrompt('vision-observe-palm');
    expect(system).toContain('掌相观察');
    expect(system).toContain('JSON');
  });

  it('userTemplate contains {{variable}} placeholders', () => {
    const { userTemplate } = loadPrompt('vision-observe-palm');
    expect(userTemplate).toMatch(/\{\{ganzhi\}\}/);
    expect(userTemplate).toMatch(/\{\{upload_description\}\}/);
  });

  it('throws descriptive error for non-existent prompt', () => {
    expect(() => loadPrompt('non-existent-prompt')).toThrow(/prompt.*not found/i);
  });
});

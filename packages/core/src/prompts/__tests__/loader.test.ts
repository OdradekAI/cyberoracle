import { describe, it, expect } from 'vitest';
import { loadPrompt, fillTemplate, loadJsonPrompt } from '../loader';
import {
  PalmReadingResultSchema,
  FaceReadingResultSchema,
  DailyFortuneResultSchema,
} from '../../schemas';

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

describe('loadJsonPrompt', () => {
  it('extracts all four sections from fallback-soft.md', () => {
    const data = loadJsonPrompt('fallback-soft');
    expect(Object.keys(data).sort()).toEqual(['companion', 'daily', 'face', 'palm']);
  });

  it('palm/face/daily sections satisfy their respective schemas', () => {
    const data = loadJsonPrompt('fallback-soft');
    expect(PalmReadingResultSchema.safeParse(data.palm).success).toBe(true);
    expect(FaceReadingResultSchema.safeParse(data.face).success).toBe(true);
    // daily.date is a runtime placeholder (empty string), but the rest must validate.
    expect(DailyFortuneResultSchema.safeParse(data.daily).success).toBe(true);
  });

  it('companion section is a record of category → non-empty string array', () => {
    const data = loadJsonPrompt('fallback-soft');
    const companion = data.companion as Record<string, string[]>;
    expect(typeof companion).toBe('object');
    for (const category of ['morning', 'idle', 'tap', 'celebrate', 'sad']) {
      expect(Array.isArray(companion[category])).toBe(true);
      expect(companion[category]!.length).toBeGreaterThan(0);
      for (const line of companion[category]!) {
        expect(typeof line).toBe('string');
      }
    }
  });

  it('throws descriptive error for non-existent json prompt', () => {
    expect(() => loadJsonPrompt('does-not-exist')).toThrow(/JSON prompt.*not found/);
  });
});

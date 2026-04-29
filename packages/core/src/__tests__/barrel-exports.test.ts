import { describe, it, expect } from 'vitest';
import {
  PalmReadingResultSchema,
  FaceReadingResultSchema,
  DailyFortuneResultSchema,
  PipelineEventSchema,
  loadPrompt,
  fillTemplate,
  checkContent,
  PACKAGE_NAME,
} from '@cyberoracle/core';

describe('core barrel exports', () => {
  it('exports PACKAGE_NAME', () => {
    expect(PACKAGE_NAME).toBe('@cyberoracle/core');
  });

  it('exports PalmReadingResultSchema', () => {
    expect(PalmReadingResultSchema).toBeDefined();
    expect(typeof PalmReadingResultSchema.parse).toBe('function');
  });

  it('exports FaceReadingResultSchema', () => {
    expect(FaceReadingResultSchema).toBeDefined();
  });

  it('exports DailyFortuneResultSchema', () => {
    expect(DailyFortuneResultSchema).toBeDefined();
  });

  it('exports PipelineEventSchema', () => {
    expect(PipelineEventSchema).toBeDefined();
  });

  it('exports loadPrompt', () => {
    expect(typeof loadPrompt).toBe('function');
    const result = loadPrompt('vision-observe-palm');
    expect(result.meta.version).toBe('1.0');
  });

  it('exports fillTemplate', () => {
    expect(typeof fillTemplate).toBe('function');
    expect(fillTemplate('Hi {{name}}', { name: 'A' })).toBe('Hi A');
  });

  it('exports checkContent', () => {
    expect(typeof checkContent).toBe('function');
    expect(checkContent('safe text').safe).toBe(true);
    expect(checkContent('健康建议').safe).toBe(false);
  });
});

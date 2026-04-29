import { describe, it, expect } from 'vitest';
import { PipelineEventSchema } from '../pipeline-event';

describe('PipelineEventSchema', () => {
  it('parses a valid running event', () => {
    const event = {
      step: 'vlm_observe',
      status: 'running',
      data: null,
    };
    const result = PipelineEventSchema.parse(event);
    expect(result.step).toBe('vlm_observe');
    expect(result.status).toBe('running');
  });

  it('parses a valid done event with data', () => {
    const event = {
      step: 'llm_interpret',
      status: 'done',
      data: { result: 'some output' },
    };
    const result = PipelineEventSchema.parse(event);
    expect(result.status).toBe('done');
    expect(result.data).toEqual({ result: 'some output' });
  });

  it('parses a valid error event', () => {
    const event = {
      step: 'complete',
      status: 'error',
      data: null,
      error: 'Model returned invalid JSON',
    };
    const result = PipelineEventSchema.parse(event);
    expect(result.error).toBe('Model returned invalid JSON');
  });

  it('rejects invalid step value', () => {
    const event = {
      step: 'invalid_step',
      status: 'running',
      data: null,
    };
    expect(() => PipelineEventSchema.parse(event)).toThrow();
  });

  it('rejects invalid status value', () => {
    const event = {
      step: 'vlm_observe',
      status: 'pending',
      data: null,
    };
    expect(() => PipelineEventSchema.parse(event)).toThrow();
  });

  it('accepts optional error field', () => {
    const event = {
      step: 'complete',
      status: 'done',
      data: { score: 85 },
    };
    const result = PipelineEventSchema.parse(event);
    expect(result.error).toBeUndefined();
  });
});

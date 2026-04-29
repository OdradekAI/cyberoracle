import { describe, it, expect } from 'vitest';
import { GET } from '../app/api/health/route';

describe('GET /api/health', () => {
  it('returns status ok with a timestamp', async () => {
    const before = Date.now();
    const res = await GET();
    const after = Date.now();

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeGreaterThanOrEqual(before);
    expect(body.timestamp).toBeLessThanOrEqual(after);
  });

  it('returns JSON content-type', async () => {
    const res = await GET();
    expect(res.headers.get('content-type')).toContain('application/json');
  });

  it('reports core package availability and content safety', async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.packages.core).toBe('@cyberoracle/core');
    expect(body.contentSafety).toBe(true);
  });
});

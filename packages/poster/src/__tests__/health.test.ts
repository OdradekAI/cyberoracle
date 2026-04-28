import { describe, it, expect } from 'vitest';
import { PACKAGE_NAME } from '../index';

describe('poster package health', () => {
  it('exports package name', () => {
    expect(PACKAGE_NAME).toBe('@cyberoracle/poster');
  });
});

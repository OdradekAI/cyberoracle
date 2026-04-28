import { describe, it, expect } from 'vitest';
import { PACKAGE_NAME } from '../index';

describe('core package health', () => {
  it('exports package name', () => {
    expect(PACKAGE_NAME).toBe('@cyberoracle/core');
  });
});

import { describe, it, expect } from 'vitest';
import { CrystalBall, UploadDropzone, NeonText, StreamingPoster, PACKAGE_NAME } from '../index';

describe('UI package exports', () => {
  it('exports PACKAGE_NAME', () => {
    expect(PACKAGE_NAME).toBe('@cyberoracle/ui');
  });

  it('exports CrystalBall as a named export', () => {
    expect(CrystalBall).toBeDefined();
    expect(typeof CrystalBall).toBe('function');
  });

  it('exports UploadDropzone as a named export', () => {
    expect(UploadDropzone).toBeDefined();
    expect(typeof UploadDropzone).toBe('function');
  });

  it('exports NeonText as a named export', () => {
    expect(NeonText).toBeDefined();
    expect(typeof NeonText).toBe('function');
  });

  it('exports StreamingPoster as a named export', () => {
    expect(StreamingPoster).toBeDefined();
    expect(typeof StreamingPoster).toBe('function');
  });
});

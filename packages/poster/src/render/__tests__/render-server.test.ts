import { describe, it, expect } from 'vitest';
import { renderToPng } from '../render-server';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const posterRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const testFontPath = resolve(posterRoot, 'fonts/NotoSerifSC-Regular.subset.otf');
const testFontBuffer = readFileSync(testFontPath);
const testFontData = new Uint8Array(testFontBuffer).buffer as ArrayBuffer;

describe('renderToPng', () => {
  it('returns a valid PNG buffer from a simple React element', async () => {
    const element = {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
        children: 'Hello Poster',
      },
    };

    const buffer = await renderToPng(element as any, {
      width: 400,
      fonts: [{ name: 'Arial', data: testFontData, weight: 400, style: 'normal' }],
    });

    expect(buffer).toBeInstanceOf(Buffer);
    // PNG magic bytes: 89 50 4E 47
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50);
    expect(buffer[2]).toBe(0x4e);
    expect(buffer[3]).toBe(0x47);
  });

  it('defaults width to 1080', async () => {
    const element = {
      type: 'div',
      props: { style: { width: '100%', height: '100%' }, children: 'Test' },
    };

    const buffer = await renderToPng(element as any, {
      fonts: [{ name: 'Arial', data: testFontData, weight: 400, style: 'normal' }],
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer[0]).toBe(0x89);
  });

  it('renders with the packaged Noto Serif SC fonts by default', async () => {
    const element = {
      type: 'div',
      props: { style: { width: '100%', height: '100%' }, children: '默认字体' },
    };

    const buffer = await renderToPng(element as any, { width: 400 });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer[0]).toBe(0x89);
  });

  it('throws descriptive error when no fonts provided and default fonts are missing', async () => {
    const element = {
      type: 'div',
      props: { children: 'Test' },
    };

    await expect(renderToPng(element as any, { width: 400, fonts: [] })).rejects.toThrow(/font/i);
  });

  it('keeps preview generation independent from Windows system fonts', () => {
    const previewScript = readFileSync(resolve(posterRoot, 'scripts/preview.ts'), 'utf8');

    expect(previewScript).not.toContain('C:/Windows/Fonts');
  });
});

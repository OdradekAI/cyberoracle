import { describe, it, expect } from 'vitest';
import { renderToPng } from '../render-server';
import { readFileSync } from 'node:fs';

const testFontBuffer = readFileSync('C:/Windows/Fonts/arial.ttf');
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

  it('throws descriptive error when no fonts provided and default fonts are missing', async () => {
    const element = {
      type: 'div',
      props: { children: 'Test' },
    };

    await expect(renderToPng(element as any, { width: 400, fonts: [] })).rejects.toThrow(/font/i);
  });
});

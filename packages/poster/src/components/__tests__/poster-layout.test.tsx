import { describe, it, expect } from 'vitest';
import { renderToPng } from '../../render/render-server';
import { PosterLayout } from '../PosterLayout';
import type { ReactNode } from 'react';
import { readFileSync } from 'node:fs';

const testFontBuffer = readFileSync('C:/Windows/Fonts/arial.ttf');
const testFontData = new Uint8Array(testFontBuffer).buffer as ArrayBuffer;
const testFonts = [{ name: 'Arial', data: testFontData, weight: 400, style: 'normal' as const }];

const sampleProps = {
  title: 'Test Fortune',
  sections: [
    { heading: 'Personality', content: 'You are creative and determined.' },
    { heading: 'Career', content: 'Success awaits in new ventures.' },
  ],
};

describe('PosterLayout', () => {
  it('renders to a valid PNG without errors', async () => {
    const element = PosterLayout(sampleProps) as ReactNode;
    const buffer = await renderToPng(element, { width: 400, fonts: testFonts });
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer[0]).toBe(0x89);
    expect(buffer[1]).toBe(0x50);
  });

  it('renders with footer', async () => {
    const element = PosterLayout({ ...sampleProps, footer: 'CyberOracle 2026' }) as ReactNode;
    const buffer = await renderToPng(element, { width: 400, fonts: testFonts });
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer[0]).toBe(0x89);
  });

  it('uses cream background color', () => {
    const element = PosterLayout(sampleProps) as any;
    expect(element.props.style.backgroundColor).toBe('#F8F5EE');
  });

  it('uses dark text color on title', () => {
    const element = PosterLayout(sampleProps) as any;
    const titleChild = element.props.children[0];
    expect(titleChild.props.style.color).toBe('#1F1B16');
  });

  it('includes gold accent divider between sections', () => {
    const element = PosterLayout(sampleProps);
    const html = JSON.stringify(element);
    expect(html).toContain('#9A7B3F');
  });

  it('contains watermark placeholder in bottom-right', () => {
    const element = PosterLayout(sampleProps) as any;
    const children = element.props.children;
    const lastChild = children[children.length - 1];
    expect(lastChild.props.style.display).toBe('flex');
    expect(lastChild.props.style.justifyContent).toBe('flex-end');
  });
});

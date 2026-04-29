import satori, { type Font as SatoriFont } from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ReactNode } from 'react';

export interface FontConfig {
  name: string;
  data: ArrayBuffer;
  weight: number;
  style: string;
}

interface RenderOptions {
  width?: number;
  fonts?: FontConfig[];
}

const posterRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const fontsDir = resolve(posterRoot, 'fonts');

const DEFAULT_FONT_FILES = [
  { path: 'NotoSerifSC-Regular.subset.otf', weight: 400, style: 'normal' as const },
  { path: 'NotoSerifSC-SemiBold.subset.otf', weight: 600, style: 'normal' as const },
];

function loadDefaultFonts(): FontConfig[] {
  const fonts: FontConfig[] = [];
  for (const { path, weight, style } of DEFAULT_FONT_FILES) {
    const filePath = resolve(fontsDir, path);
    try {
      const data = readFileSync(filePath);
      fonts.push({ name: 'Noto Serif SC', data: data.buffer as ArrayBuffer, weight, style });
    } catch {
      // skip missing font files
    }
  }
  return fonts;
}

export async function renderToPng(
  element: ReactNode,
  options: RenderOptions = {},
): Promise<Buffer> {
  const width = options.width ?? 1080;
  const fonts = options.fonts ?? loadDefaultFonts();

  if (fonts.length === 0) {
    throw new Error(
      'No fonts available for rendering. Provide fonts via options.fonts or run pnpm fonts:prepare to generate font subsets.',
    );
  }

  const satoriFonts: SatoriFont[] = fonts.map((f) => ({
    name: f.name,
    data: f.data,
    weight: f.weight as 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900,
    style: f.style as 'normal' | 'italic',
  }));

  const svg = await satori(element, {
    width,
    fonts: satoriFonts,
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width },
  });
  const pngData = resvg.render();

  return Buffer.from(pngData.asPng());
}

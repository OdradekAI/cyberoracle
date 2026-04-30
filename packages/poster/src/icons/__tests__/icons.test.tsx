import { describe, it, expect } from 'vitest';
import { renderToPng } from '../../render/render-server';
import { PalmDiagram } from '../PalmDiagram';
import { HeartIcon } from '../HeartLine';
import { BrainIcon } from '../BrainLine';
import { LeafIcon } from '../LeafLine';
import { SignpostIcon } from '../Signpost';
import { WaveIcon } from '../Wave';
import { MountainScene } from '../MountainScene';
import { RiverScene } from '../RiverScene';
import { CloudScene } from '../CloudScene';
import { LotusScene } from '../LotusScene';
import { CornerOrnament } from '../CornerOrnament';
import { Watermark } from '../Watermark';
import { Box } from '../../primitives/Box';
import { readFileSync } from 'node:fs';

const testFontBuffer = readFileSync('C:/Windows/Fonts/arial.ttf');
const testFontData = new Uint8Array(testFontBuffer).buffer as ArrayBuffer;
const testFonts = [{ name: 'Arial', data: testFontData, weight: 400, style: 'normal' as const }];

async function rendersToPng(element: React.ReactNode): Promise<Buffer> {
  return renderToPng(element, { width: 400, fonts: testFonts });
}

function isValidPng(buf: Buffer): boolean {
  return buf[0] === 0x89 && buf[1] === 0x50;
}

describe('small stroke icons', () => {
  it('HeartIcon renders to valid PNG', async () => {
    const buf = await rendersToPng(<HeartIcon />);
    expect(isValidPng(buf)).toBe(true);
  });

  it('HeartIcon renders with custom size', async () => {
    const buf = await rendersToPng(<HeartIcon size={36} />);
    expect(isValidPng(buf)).toBe(true);
  });

  it('BrainIcon renders to valid PNG', async () => {
    const buf = await rendersToPng(<BrainIcon />);
    expect(isValidPng(buf)).toBe(true);
  });

  it('LeafIcon renders to valid PNG', async () => {
    const buf = await rendersToPng(<LeafIcon />);
    expect(isValidPng(buf)).toBe(true);
  });

  it('SignpostIcon renders to valid PNG', async () => {
    const buf = await rendersToPng(<SignpostIcon />);
    expect(isValidPng(buf)).toBe(true);
  });

  it('WaveIcon renders to valid PNG', async () => {
    const buf = await rendersToPng(<WaveIcon />);
    expect(isValidPng(buf)).toBe(true);
  });
});

describe('PalmDiagram', () => {
  it('renders to valid PNG', async () => {
    const buf = await rendersToPng(<PalmDiagram />);
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders with custom dimensions', async () => {
    const buf = await rendersToPng(<PalmDiagram width={200} height={260} />);
    expect(isValidPng(buf)).toBe(true);
  });
});

describe('illustration scene icons', () => {
  it('MountainScene renders to valid PNG', async () => {
    const buf = await rendersToPng(<MountainScene />);
    expect(isValidPng(buf)).toBe(true);
  });

  it('RiverScene renders to valid PNG', async () => {
    const buf = await rendersToPng(<RiverScene />);
    expect(isValidPng(buf)).toBe(true);
  });

  it('CloudScene renders to valid PNG', async () => {
    const buf = await rendersToPng(<CloudScene />);
    expect(isValidPng(buf)).toBe(true);
  });

  it('LotusScene renders to valid PNG', async () => {
    const buf = await rendersToPng(<LotusScene />);
    expect(isValidPng(buf)).toBe(true);
  });
});

describe('CornerOrnament', () => {
  it('renders top-left variant', async () => {
    const buf = await rendersToPng(<CornerOrnament variant="tl" />);
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders all four variants', async () => {
    const buf = await rendersToPng(
      <Box direction="row" gap={8}>
        <CornerOrnament variant="tl" />
        <CornerOrnament variant="tr" />
        <CornerOrnament variant="bl" />
        <CornerOrnament variant="br" />
      </Box>,
    );
    expect(isValidPng(buf)).toBe(true);
  });
});

describe('Watermark', () => {
  it('renders with date only', async () => {
    const buf = await rendersToPng(<Watermark date="2026-04-30" />);
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders with QR code placeholder', async () => {
    const buf = await rendersToPng(
      <Watermark
        date="2026-04-30"
        qrDataUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
      />,
    );
    expect(isValidPng(buf)).toBe(true);
  });
});

describe('icon composability', () => {
  it('renders multiple icons in a row layout', async () => {
    const buf = await rendersToPng(
      <Box direction="row" gap={10} align="center" padding={20} background="#F8F5EE">
        <HeartIcon size={24} />
        <BrainIcon size={24} />
        <LeafIcon size={24} />
        <SignpostIcon size={24} />
        <WaveIcon size={24} />
      </Box>,
    );
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders scene icon with watermark', async () => {
    const buf = await rendersToPng(
      <Box direction="column" gap={12} padding={20} background="#F8F5EE">
        <MountainScene width={360} height={100} />
        <Box direction="row" justify="flex-end" width="100%">
          <Watermark date="2026-04-30" />
        </Box>
      </Box>,
    );
    expect(isValidPng(buf)).toBe(true);
  });
});

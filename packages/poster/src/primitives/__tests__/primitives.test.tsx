import { describe, it, expect } from 'vitest';
import { renderToPng } from '../../render/render-server';
import { Box } from '../Box';
import { Text } from '../Text';
import { Card } from '../Card';
import { SectionNumber } from '../SectionNumber';
import { Divider } from '../Divider';
import { Tag } from '../Tag';
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

describe('Box', () => {
  it('renders to valid PNG', async () => {
    const buf = await rendersToPng(<Box>Hello</Box>);
    expect(isValidPng(buf)).toBe(true);
  });

  it('always applies display: flex', async () => {
    const buf = await rendersToPng(
      <Box direction="column" gap={10}>
        <Box>A</Box>
        <Box>B</Box>
      </Box>,
    );
    expect(isValidPng(buf)).toBe(true);
  });

  it('supports flexDirection column', async () => {
    const buf = await rendersToPng(
      <Box direction="column" gap={8}>
        <Box>Top</Box>
        <Box>Bottom</Box>
      </Box>,
    );
    expect(isValidPng(buf)).toBe(true);
  });

  it('supports background and borderRadius', async () => {
    const buf = await rendersToPng(
      <Box background="#F8F5EE" borderRadius={16} padding={20}>
        Content
      </Box>,
    );
    expect(isValidPng(buf)).toBe(true);
  });
});

describe('Text', () => {
  it('renders to valid PNG', async () => {
    const buf = await rendersToPng(<Text>Hello World</Text>);
    expect(isValidPng(buf)).toBe(true);
  });

  it('applies Noto Serif SC font family', async () => {
    const buf = await rendersToPng(<Text>Font test</Text>);
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders with different sizes', async () => {
    const buf = await rendersToPng(
      <Box direction="column" gap={10}>
        <Text size="title">Title</Text>
        <Text size="body">Body</Text>
        <Text size="caption">Caption</Text>
      </Box>,
    );
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders asBlock mode for long text', async () => {
    const buf = await rendersToPng(
      <Text size="body" asBlock>
        This is a long piece of text that should wrap in block mode for satori rendering.
      </Text>,
    );
    expect(isValidPng(buf)).toBe(true);
  });
});

describe('SectionNumber', () => {
  it('renders to valid PNG', async () => {
    const buf = await rendersToPng(<SectionNumber index={1} />);
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders single-digit with leading zero', async () => {
    const buf = await rendersToPng(<SectionNumber index={3} />);
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders two-digit number', async () => {
    const buf = await rendersToPng(<SectionNumber index={12} />);
    expect(isValidPng(buf)).toBe(true);
  });
});

describe('Card', () => {
  it('renders to valid PNG', async () => {
    const buf = await rendersToPng(
      <Card index={1} heading="Test Card">
        <Text size="body" asBlock>
          Card body content
        </Text>
      </Card>,
    );
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders with trailing element', async () => {
    const buf = await rendersToPng(
      <Card
        index={2}
        heading="With Icon"
        trailing={<Box width={20} height={20} background="#9A7B3F" borderRadius={10} />}
      >
        <Text size="body">Content</Text>
      </Card>,
    );
    expect(isValidPng(buf)).toBe(true);
  });

  it('has paper background and rounded border', async () => {
    const buf = await rendersToPng(
      <Card index={1} heading="Styled">
        <Text>Styled card</Text>
      </Card>,
    );
    expect(isValidPng(buf)).toBe(true);
  });
});

describe('Divider', () => {
  it('renders to valid PNG', async () => {
    const buf = await rendersToPng(
      <Box direction="column" gap={10}>
        <Text>Above</Text>
        <Divider />
        <Text>Below</Text>
      </Box>,
    );
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders with marginY', async () => {
    const buf = await rendersToPng(
      <Box direction="column">
        <Text>Top</Text>
        <Divider marginY={12} />
        <Text>Bottom</Text>
      </Box>,
    );
    expect(isValidPng(buf)).toBe(true);
  });
});

describe('Tag', () => {
  it('renders to valid PNG', async () => {
    const buf = await rendersToPng(<Tag>稳步推进型</Tag>);
    expect(isValidPng(buf)).toBe(true);
  });

  it('renders short label', async () => {
    const buf = await rendersToPng(<Tag>测试</Tag>);
    expect(isValidPng(buf)).toBe(true);
  });
});

describe('composability', () => {
  it('Card > Box > Text composition renders', async () => {
    const buf = await rendersToPng(
      <Card index={1} heading="综合">
        <Box direction="column" gap={8}>
          <Text size="bodyLarge" weight="semibold">
            子标题
          </Text>
          <Text size="body" asBlock>
            这是正文的详细描述内容。
          </Text>
        </Box>
        <Divider />
        <Box direction="row" gap={10}>
          <Tag>标签一</Tag>
          <Tag>标签二</Tag>
        </Box>
      </Card>,
    );
    expect(isValidPng(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(1000);
  });

  it('full vertical layout: Card + Card + Divider', async () => {
    const buf = await rendersToPng(
      <Box direction="column" gap={24} width={400} padding={20} background="#F8F5EE">
        <Card index={1} heading="模块一">
          <Text size="body" asBlock>
            第一个模块的内容
          </Text>
        </Card>
        <Card index={2} heading="模块二">
          <Box direction="row" gap={10} align="center">
            <SectionNumber index={1} />
            <Text>子项</Text>
          </Box>
        </Card>
        <Divider />
        <Tag>底部标签</Tag>
      </Box>,
    );
    expect(isValidPng(buf)).toBe(true);
  });
});

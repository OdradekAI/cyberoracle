import { Box } from '../primitives/Box';
import { Text } from '../primitives/Text';
import { Card } from '../primitives/Card';
import { Divider } from '../primitives/Divider';
import { HeartIcon } from '../icons/HeartLine';
import { BrainIcon } from '../icons/BrainLine';
import { LeafIcon } from '../icons/LeafLine';
import { SignpostIcon } from '../icons/Signpost';
import { WaveIcon } from '../icons/Wave';
import { PalmDiagram } from '../icons/PalmDiagram';
import { MountainScene } from '../icons/MountainScene';
import { RiverScene } from '../icons/RiverScene';
import { CloudScene } from '../icons/CloudScene';
import { LotusScene } from '../icons/LotusScene';
import { CornerOrnament } from '../icons/CornerOrnament';
import { Watermark } from '../icons/Watermark';
import { colors, layout, typography } from '../tokens';

export interface PalmReadingPosterData {
  meta: { title: string; subtitle: string };
  overview: { heading: string; body: string };
  mainLines: Array<{ name: string; icon: 'heart' | 'brain' | 'leaf'; body: string }>;
  auxiliary: Array<{ icon: 'signpost' | 'wave'; label: string; body: string }>;
  temperament: { heading: string; body: string };
  summary: {
    heading: string;
    body: string;
    illustration: 'mountain' | 'river' | 'cloud' | 'lotus';
  };
  disclaimer: { label: string; body: string };
}

interface Props {
  data: PalmReadingPosterData;
  qrDataUrl?: string;
  date?: string;
  source?: 'web' | 'desktop';
}

const MAIN_LINE_ICONS = {
  heart: HeartIcon,
  brain: BrainIcon,
  leaf: LeafIcon,
} as const;

const AUX_ICONS = {
  signpost: SignpostIcon,
  wave: WaveIcon,
} as const;

const SCENE_ICONS = {
  mountain: MountainScene,
  river: RiverScene,
  cloud: CloudScene,
  lotus: LotusScene,
} as const;

export function PalmReadingPoster({ data, qrDataUrl, date, source = 'web' }: Props) {
  const SceneIcon = SCENE_ICONS[data.summary.illustration] ?? MountainScene;
  const displayDate = date ?? new Date().toLocaleDateString('zh-CN');

  return (
    <Box
      direction="column"
      width={layout.canvas.width}
      background={colors.paper}
      paddingX={layout.canvas.paddingX}
      paddingY={layout.canvas.paddingY}
      gap={layout.card.gapBetween}
      style={{ position: 'relative' }}
    >
      {/* Corner ornaments */}
      <Box direction="row" style={{ position: 'absolute', top: 16, left: 16 }}>
        <CornerOrnament variant="tl" />
      </Box>
      <Box direction="row" style={{ position: 'absolute', top: 16, right: 16 }}>
        <CornerOrnament variant="tr" />
      </Box>

      {/* Title */}
      <Box direction="column" align="center" gap={16} width="100%">
        <Text
          size="title"
          weight="semibold"
          color="ink"
          letterSpacing={typography.letterSpacing.title}
        >
          {data.meta.title}
        </Text>
        <Box direction="row" align="center" gap={12}>
          <Box width={40} height={1} background={colors.gold} />
          <Text size="subtitle" color="inkSoft" letterSpacing={2}>
            {data.meta.subtitle}
          </Text>
          <Box width={40} height={1} background={colors.gold} />
        </Box>
      </Box>

      {/* Module 1: Left diagram + Right overview */}
      <Box direction="row" gap={20} width="100%" align="stretch">
        <Box
          direction="column"
          align="center"
          justify="center"
          gap={12}
          flex={1}
          paddingY={24}
          background={colors.paper}
          borderRadius={layout.card.radius}
          border={`1px solid ${colors.line}`}
        >
          <Box direction="row" align="center" gap={10}>
            <Box width={6} height={6} borderRadius={3} background={colors.gold} />
            <Text size="caption" color="inkSoft" letterSpacing={3}>
              掌纹示意图
            </Text>
            <Box width={6} height={6} borderRadius={3} background={colors.gold} />
          </Box>
          <PalmDiagram />
        </Box>

        <Box flex={1.1} direction="column">
          <Card index={1} heading={data.overview.heading}>
            <Text size="body" lineHeight="normal" color="ink" asBlock>
              {data.overview.body}
            </Text>
          </Card>
        </Box>
      </Box>

      {/* Module 2: Three main lines */}
      <Card index={2} heading="三大主线解读">
        {data.mainLines.map((line, i) => {
          const Icon = MAIN_LINE_ICONS[line.icon] ?? HeartIcon;
          return (
            <Box key={line.name} direction="column" gap={10}>
              <Box direction="row" align="center" gap={14}>
                <Box
                  direction="row"
                  justify="center"
                  align="center"
                  width={44}
                  height={44}
                  borderRadius={22}
                  background={colors.paperDeep}
                  style={{ flexShrink: 0 }}
                >
                  <Icon size={22} />
                </Box>
                <Text size="bodyLarge" weight="semibold" color="ink" letterSpacing={2}>
                  {line.name}
                </Text>
              </Box>
              <Text
                size="body"
                color="inkSoft"
                lineHeight="normal"
                asBlock
                style={{ paddingLeft: 58 }}
              >
                {line.body}
              </Text>
              {i < data.mainLines.length - 1 && <Divider marginY={6} />}
            </Box>
          );
        })}
      </Card>

      {/* Module 3: Auxiliary observations */}
      <Card index={3} heading="辅助线观察">
        {data.auxiliary.map((aux, i) => {
          const Icon = AUX_ICONS[aux.icon] ?? SignpostIcon;
          return (
            <Box key={i} direction="row" gap={14} align="flex-start">
              <Box
                direction="row"
                justify="center"
                align="center"
                width={40}
                height={40}
                borderRadius={20}
                background={colors.paperDeep}
                style={{ flexShrink: 0, marginTop: 2 }}
              >
                <Icon size={20} />
              </Box>
              <Box direction="column" flex={1} gap={6}>
                <Text size="bodyLarge" weight="semibold" color="ink">
                  {aux.label}
                </Text>
                <Text size="body" color="inkSoft" lineHeight="normal" asBlock>
                  {aux.body}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Card>

      {/* Module 4: Temperament */}
      <Card index={4} heading={data.temperament.heading}>
        <Text size="body" color="ink" lineHeight="normal" asBlock>
          {data.temperament.body}
        </Text>
      </Card>

      {/* Module 5: Summary with scene illustration */}
      <Box
        direction="column"
        paddingX={layout.card.paddingX}
        paddingY={layout.card.paddingY}
        background={colors.paperDeep}
        borderRadius={layout.card.radius}
        border={`1px solid ${colors.goldSoft}`}
        gap={18}
      >
        <Box direction="row" align="center" justify="space-between">
          <Box direction="row" align="center" gap={14}>
            <Box
              direction="row"
              justify="center"
              align="center"
              width={40}
              height={40}
              borderRadius={20}
              background={colors.paper}
              style={{ flexShrink: 0 }}
            >
              <Text size="caption" weight="semibold" color="gold">
                05
              </Text>
            </Box>
            <Text size="sectionHeading" weight="semibold" color="ink" letterSpacing={2}>
              {data.summary.heading}
            </Text>
          </Box>
        </Box>

        <Box direction="row" justify="center" width="100%">
          <SceneIcon width={520} height={120} />
        </Box>

        <Text size="body" color="ink" lineHeight="loose" asBlock>
          {data.summary.body}
        </Text>
      </Box>

      {/* Module 6: Disclaimer */}
      <Box
        direction="row"
        align="center"
        gap={16}
        paddingX={28}
        paddingY={20}
        background={colors.paper}
        borderRadius={layout.card.radius}
        border={`1px solid ${colors.line}`}
      >
        <Box
          direction="row"
          justify="center"
          align="center"
          width={40}
          height={40}
          borderRadius={20}
          background={colors.paperDeep}
          style={{ flexShrink: 0 }}
        >
          <Text size="caption" weight="semibold" color="gold">
            06
          </Text>
        </Box>
        <Box direction="column" flex={1} gap={4}>
          <Text size="body" weight="semibold" color="ink">
            {data.disclaimer.label}
          </Text>
          <Text size="caption" color="inkSoft" lineHeight="normal" asBlock>
            {data.disclaimer.body}
          </Text>
        </Box>
      </Box>

      {/* Watermark */}
      <Box direction="row" justify="flex-end" width="100%" style={{ marginTop: 8 }}>
        <Watermark
          qrDataUrl={source === 'web' ? qrDataUrl : undefined}
          date={`${source === 'web' ? '网页版' : '桌面版'} · ${displayDate}`}
        />
      </Box>
    </Box>
  );
}

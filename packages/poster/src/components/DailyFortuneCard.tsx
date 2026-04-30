import { Box } from '../primitives/Box';
import { Text } from '../primitives/Text';
import { Card } from '../primitives/Card';
import { Divider } from '../primitives/Divider';
import { SignpostIcon } from '../icons/Signpost';
import { WaveIcon } from '../icons/Wave';
import { MountainScene } from '../icons/MountainScene';
import { CornerOrnament } from '../icons/CornerOrnament';
import { Watermark } from '../icons/Watermark';
import { colors, layout, typography } from '../tokens';

export interface DailyFortuneCardData {
  title: string;
  date: string;
  ganzhi: string;
  solarTerm: string;
  ratings: { overall: number; work: number; relationship: number; creative: number; rest: number };
  lucky: { color: string; direction: string; number: number; moment: string };
  advice: { do: string; avoid: string };
  oneLine: string;
}

interface Props {
  data: DailyFortuneCardData;
  date?: string;
  source?: 'web' | 'desktop';
}

const RATING_LABELS: Record<string, string> = {
  overall: '总评',
  work: '工作',
  relationship: '感情',
  creative: '创意',
  rest: '休养',
};

const RATING_KEYS = ['overall', 'work', 'relationship', 'creative', 'rest'] as const;

function StarBar({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <Box direction="row" gap={4} align="center">
      {Array.from({ length: max }).map((_, i) => (
        <Box
          key={i}
          width={12}
          height={12}
          borderRadius={6}
          background={i < value ? colors.gold : colors.line}
        />
      ))}
    </Box>
  );
}

export function DailyFortuneCard({ data, date, source = 'web' }: Props) {
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
          {data.title}
        </Text>
        <Box direction="row" align="center" gap={12}>
          <Box width={40} height={1} background={colors.gold} />
          <Text size="subtitle" color="inkSoft" letterSpacing={2}>
            {data.date}
          </Text>
          <Box width={40} height={1} background={colors.gold} />
        </Box>
        <Box direction="row" align="center" gap={8}>
          <Text size="caption" color="inkMuted" letterSpacing={1}>
            {data.ganzhi}
          </Text>
          {data.solarTerm ? (
            <>
              <Text size="caption" color="inkMuted">
                ·
              </Text>
              <Text size="caption" color="gold" letterSpacing={1}>
                {data.solarTerm}
              </Text>
            </>
          ) : null}
        </Box>
      </Box>

      {/* Ratings */}
      <Card index={1} heading="今日指数">
        <Box direction="column" gap={12} width="100%">
          {RATING_KEYS.map((key) => (
            <Box key={key} direction="row" justify="space-between" align="center" width="100%">
              <Text size="body" color="ink" style={{ width: 60 }}>
                {RATING_LABELS[key]}
              </Text>
              <StarBar value={data.ratings[key]} />
            </Box>
          ))}
        </Box>
      </Card>

      {/* Lucky info */}
      <Card index={2} heading="今日幸运">
        <Box direction="row" gap={20} width="100%" wrap>
          <LuckyItem label="幸运色" value={data.lucky.color} />
          <LuckyItem label="方位" value={data.lucky.direction} />
          <LuckyItem label="数字" value={String(data.lucky.number)} />
          <LuckyItem label="时刻" value={data.lucky.moment} />
        </Box>
      </Card>

      {/* Advice */}
      <Card index={3} heading="今日宜忌">
        <Box direction="column" gap={16} width="100%">
          <Box direction="row" gap={14} align="flex-start">
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
              <SignpostIcon size={20} />
            </Box>
            <Box direction="column" flex={1} gap={4}>
              <Text size="bodyLarge" weight="semibold" color="ink">
                宜
              </Text>
              <Text size="body" color="inkSoft" lineHeight="normal" asBlock>
                {data.advice.do}
              </Text>
            </Box>
          </Box>
          <Divider marginY={4} />
          <Box direction="row" gap={14} align="flex-start">
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
              <WaveIcon size={20} />
            </Box>
            <Box direction="column" flex={1} gap={4}>
              <Text size="bodyLarge" weight="semibold" color="ink">
                忌
              </Text>
              <Text size="body" color="inkSoft" lineHeight="normal" asBlock>
                {data.advice.avoid}
              </Text>
            </Box>
          </Box>
        </Box>
      </Card>

      {/* One-line fortune */}
      <Box
        direction="column"
        paddingX={layout.card.paddingX}
        paddingY={layout.card.paddingY}
        background={colors.paperDeep}
        borderRadius={layout.card.radius}
        border={`1px solid ${colors.goldSoft}`}
        gap={14}
      >
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
            <MountainScene width={26} height={26} />
          </Box>
          <Text size="sectionHeading" weight="semibold" color="ink" letterSpacing={2}>
            今日一句话
          </Text>
        </Box>
        <Text size="body" color="ink" lineHeight="loose" asBlock>
          {data.oneLine}
        </Text>
      </Box>

      {/* Watermark */}
      <Box direction="row" justify="flex-end" width="100%" style={{ marginTop: 8 }}>
        <Watermark date={`${source === 'web' ? '网页版' : '桌面版'} · ${displayDate}`} />
      </Box>
    </Box>
  );
}

function LuckyItem({ label, value }: { label: string; value: string }) {
  return (
    <Box direction="column" gap={4} align="center" flex={1}>
      <Text size="caption" color="inkMuted">
        {label}
      </Text>
      <Text size="bodyLarge" weight="semibold" color="gold">
        {value}
      </Text>
    </Box>
  );
}

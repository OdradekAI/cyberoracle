import { Box } from './Box';
import { Text } from './Text';
import { colors, layout } from '../tokens';

interface SectionNumberProps {
  index: number;
}

export function SectionNumber({ index }: SectionNumberProps) {
  const size = layout.sectionNumber.size;
  return (
    <Box
      direction="row"
      justify="center"
      align="center"
      width={size}
      height={size}
      borderRadius={size / 2}
      background={colors.paperDeep}
      style={{ flexShrink: 0 }}
    >
      <Text size="caption" weight="semibold" color="gold" letterSpacing={1}>
        {String(index).padStart(2, '0')}
      </Text>
    </Box>
  );
}

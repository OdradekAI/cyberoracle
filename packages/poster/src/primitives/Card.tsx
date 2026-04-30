import type { ReactNode } from 'react';
import { Box } from './Box';
import { Text } from './Text';
import { SectionNumber } from './SectionNumber';
import { colors, layout } from '../tokens';

interface CardProps {
  index: number;
  heading: string;
  trailing?: ReactNode;
  children: ReactNode;
}

export function Card({ index, heading, trailing, children }: CardProps) {
  return (
    <Box
      direction="column"
      width="100%"
      paddingX={layout.card.paddingX}
      paddingY={layout.card.paddingY}
      background={colors.paper}
      borderRadius={layout.card.radius}
      border={`${layout.card.borderWidth}px solid ${colors.line}`}
      gap={20}
    >
      <Box direction="row" align="center" justify="space-between" width="100%">
        <Box direction="row" align="center" gap={14}>
          <SectionNumber index={index} />
          <Text size="sectionHeading" weight="semibold" color="ink" letterSpacing={2}>
            {heading}
          </Text>
        </Box>
        {trailing && (
          <Box direction="row" align="center">
            {trailing}
          </Box>
        )}
      </Box>

      <Box direction="column" width="100%" gap={layout.module.sectionGap}>
        {children}
      </Box>
    </Box>
  );
}

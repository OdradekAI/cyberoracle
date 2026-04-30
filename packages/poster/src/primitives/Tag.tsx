import { Box } from './Box';
import { Text } from './Text';
import { colors } from '../tokens';

interface TagProps {
  children: string;
}

export function Tag({ children }: TagProps) {
  return (
    <Box
      direction="row"
      align="center"
      paddingX={12}
      paddingY={6}
      borderRadius={6}
      border={`1px solid ${colors.gold}`}
    >
      <Text size="caption" color="gold" weight="semibold" letterSpacing={1}>
        {children}
      </Text>
    </Box>
  );
}

import { Box } from './Box';
import { colors } from '../tokens';

export function Divider({ marginY = 0 }: { marginY?: number }) {
  return (
    <Box
      direction="row"
      width="100%"
      height={1}
      background={colors.line}
      style={{ marginTop: marginY, marginBottom: marginY }}
    />
  );
}

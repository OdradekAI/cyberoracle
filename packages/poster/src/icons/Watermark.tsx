import { Box } from '../primitives/Box';
import { Text } from '../primitives/Text';
import { colors } from '../tokens';

interface WatermarkProps {
  qrDataUrl?: string;
  date: string;
}

export function Watermark({ qrDataUrl, date }: WatermarkProps) {
  return (
    <Box direction="row" align="center" gap={12}>
      {qrDataUrl && (
        <img
          src={qrDataUrl}
          width={64}
          height={64}
          style={{ borderRadius: 6, border: `1px solid ${colors.line}` }}
        />
      )}
      <Box direction="column" gap={4}>
        <Text size="footnote" color="inkMuted">
          由赛博玄学馆生成
        </Text>
        <Text size="footnote" color="inkMuted">
          {date}
        </Text>
        {qrDataUrl && (
          <Text size="footnote" color="gold">
            扫码下载桌面版
          </Text>
        )}
      </Box>
    </Box>
  );
}

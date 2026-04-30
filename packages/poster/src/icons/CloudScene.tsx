import { colors } from '../tokens';

interface CloudSceneProps {
  width?: number;
  height?: number;
}

export function CloudScene({ width = 220, height = 110 }: CloudSceneProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 220 110" fill="none">
      <path
        d="M40 80 Q 40 55 65 50 Q 70 30 95 30 Q 120 25 130 45 Q 135 35 155 35 Q 175 35 180 55 Q 200 55 200 70 Q 200 80 190 80 Z"
        fill={colors.paperDeep}
        stroke={colors.ink}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      <path
        d="M15 90 Q 30 85 50 90 Q 70 82 90 88 Q 110 82 130 90 Q 150 84 170 90 Q 190 85 210 90"
        stroke={colors.inkMuted}
        strokeWidth={0.8}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M10 100 Q 50 95 90 100 Q 130 95 170 100 Q 200 96 220 100"
        stroke={colors.goldSoft}
        strokeWidth={0.8}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

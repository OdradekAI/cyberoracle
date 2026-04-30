import { colors } from '../tokens';

interface RiverSceneProps {
  width?: number;
  height?: number;
}

export function RiverScene({ width = 220, height = 110 }: RiverSceneProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 220 110" fill="none">
      <path
        d="M0 40 Q 30 30 60 45 Q 100 25 140 40 Q 180 20 220 38 L 220 110 L 0 110 Z"
        fill={colors.paperDeep}
        stroke="none"
      />
      <path
        d="M0 60 Q 50 55 110 65 Q 170 50 220 60"
        stroke={colors.ink}
        strokeWidth={1.2}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M10 75 Q 60 70 120 80 Q 180 68 220 75"
        stroke={colors.goldSoft}
        strokeWidth={1}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M0 90 Q 70 85 140 92 Q 190 82 220 90"
        stroke={colors.inkMuted}
        strokeWidth={0.8}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M100 45 L 100 55 M96 50 L 104 50" stroke={colors.ink} strokeWidth={0.8} />
      <path d="M160 35 L 160 48 M157 42 L 163 42" stroke={colors.ink} strokeWidth={0.8} />
    </svg>
  );
}

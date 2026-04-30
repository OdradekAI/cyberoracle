import { colors } from '../tokens';

interface MountainSceneProps {
  width?: number;
  height?: number;
}

export function MountainScene({ width = 220, height = 110 }: MountainSceneProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 220 110" fill="none">
      <path
        d="M0 70 Q 30 40 60 60 Q 90 38 130 58 Q 170 30 220 58 L 220 110 L 0 110 Z"
        fill={colors.paperDeep}
        stroke="none"
      />
      <path
        d="M0 85 L 25 60 L 50 78 L 80 55 L 110 80 L 145 60 L 175 80 L 200 65 L 220 82 L 220 110 L 0 110 Z"
        stroke={colors.ink}
        strokeWidth={1.2}
        fill="none"
        strokeLinejoin="round"
      />
      <path d="M30 92 L 30 100 M28 96 L 32 96" stroke={colors.ink} strokeWidth={1} />
      <path d="M55 88 L 55 100 M52 93 L 58 93" stroke={colors.ink} strokeWidth={1} />
      <path d="M180 90 L 180 100 M177 95 L 183 95" stroke={colors.ink} strokeWidth={1} />
      <path
        d="M0 105 Q 60 98 120 104 Q 180 100 220 105"
        stroke={colors.goldSoft}
        strokeWidth={1}
        fill="none"
      />
    </svg>
  );
}

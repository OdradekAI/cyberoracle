import { colors } from '../tokens';

interface LotusSceneProps {
  width?: number;
  height?: number;
}

export function LotusScene({ width = 220, height = 110 }: LotusSceneProps) {
  return (
    <svg width={width} height={height} viewBox="0 0 220 110" fill="none">
      <path
        d="M110 30 Q 95 45 95 60 Q 95 75 110 85 Q 125 75 125 60 Q 125 45 110 30 Z"
        stroke={colors.ink}
        strokeWidth={1.2}
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="M110 40 Q 85 50 80 65 Q 80 78 95 80"
        stroke={colors.ink}
        strokeWidth={1}
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="M110 40 Q 135 50 140 65 Q 140 78 125 80"
        stroke={colors.ink}
        strokeWidth={1}
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="M110 50 Q 75 55 65 70 Q 65 82 85 82"
        stroke={colors.inkMuted}
        strokeWidth={0.8}
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="M110 50 Q 145 55 155 70 Q 155 82 135 82"
        stroke={colors.inkMuted}
        strokeWidth={0.8}
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="M50 95 Q 80 90 110 95 Q 140 90 170 95 Q 200 90 220 95"
        stroke={colors.goldSoft}
        strokeWidth={1}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

import { colors } from '../tokens';

interface FaceOutlineIconProps {
  size?: number;
}

export function FaceOutlineIcon({ size = 28 }: FaceOutlineIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path
        d="M14 3 Q 22 3 24 12 Q 25 18 22 22 Q 19 25 14 25 Q 9 25 6 22 Q 3 18 4 12 Q 6 3 14 3 Z"
        stroke={colors.gold}
        strokeWidth={1.4}
        fill="none"
        strokeLinejoin="round"
      />
      <line
        x1={10}
        y1={13}
        x2={10}
        y2={14}
        stroke={colors.gold}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <line
        x1={18}
        y1={13}
        x2={18}
        y2={14}
        stroke={colors.gold}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <path
        d="M11 19 Q 14 21 17 19"
        stroke={colors.gold}
        strokeWidth={1}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

import { colors } from '../tokens';

interface EyeIconProps {
  size?: number;
}

export function EyeIcon({ size = 28 }: EyeIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path
        d="M4 14 Q 10 6 14 6 Q 18 6 24 14 Q 18 22 14 22 Q 10 22 4 14 Z"
        stroke={colors.gold}
        strokeWidth={1.4}
        fill="none"
        strokeLinejoin="round"
      />
      <circle cx={14} cy={14} r={4} stroke={colors.gold} strokeWidth={1.4} fill="none" />
      <circle cx={14} cy={14} r={1.5} fill={colors.gold} />
    </svg>
  );
}

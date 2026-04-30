import { colors } from '../tokens';

interface BrainIconProps {
  size?: number;
}

export function BrainIcon({ size = 28 }: BrainIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path
        d="M9 8 Q 5 8 5 12 Q 5 14 6 15 Q 5 16 5 18 Q 5 22 9 22 L 19 22 Q 23 22 23 18 Q 23 16 22 15 Q 23 14 23 12 Q 23 8 19 8 Z M 14 8 L 14 22"
        stroke={colors.gold}
        strokeWidth={1.4}
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  );
}

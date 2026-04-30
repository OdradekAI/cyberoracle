import { colors } from '../tokens';

interface EyebrowIconProps {
  size?: number;
}

export function EyebrowIcon({ size = 28 }: EyebrowIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path
        d="M4 16 Q 8 8 14 10 Q 20 8 24 16"
        stroke={colors.gold}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M8 14 Q 12 12 16 13"
        stroke={colors.gold}
        strokeWidth={0.8}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

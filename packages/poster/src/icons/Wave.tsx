import { colors } from '../tokens';

interface WaveIconProps {
  size?: number;
}

export function WaveIcon({ size = 28 }: WaveIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path
        d="M3 10 Q 8 5, 14 10 T 25 10"
        stroke={colors.gold}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M3 16 Q 8 11, 14 16 T 25 16"
        stroke={colors.gold}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M3 22 Q 8 17, 14 22 T 25 22"
        stroke={colors.gold}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

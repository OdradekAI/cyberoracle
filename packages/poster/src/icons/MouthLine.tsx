import { colors } from '../tokens';

interface MouthIconProps {
  size?: number;
}

export function MouthIcon({ size = 28 }: MouthIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path
        d="M6 14 Q 10 10 14 12 Q 18 10 22 14"
        stroke={colors.gold}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M6 14 Q 10 22 14 18 Q 18 22 22 14"
        stroke={colors.gold}
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

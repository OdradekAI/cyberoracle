import { colors } from '../tokens';

interface HeartIconProps {
  size?: number;
}

export function HeartIcon({ size = 28 }: HeartIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path
        d="M14 24 C 4 17, 4 9, 9 7 C 12 6, 14 8, 14 10 C 14 8, 16 6, 19 7 C 24 9, 24 17, 14 24 Z"
        stroke={colors.gold}
        strokeWidth={1.4}
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  );
}

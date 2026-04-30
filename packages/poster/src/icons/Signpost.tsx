import { colors } from '../tokens';

interface SignpostIconProps {
  size?: number;
}

export function SignpostIcon({ size = 28 }: SignpostIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path d="M14 4 L 14 24" stroke={colors.gold} strokeWidth={1.4} strokeLinecap="round" />
      <path
        d="M5 8 L 22 8 L 24 10 L 22 12 L 5 12 Z"
        stroke={colors.gold}
        strokeWidth={1.4}
        fill="none"
        strokeLinejoin="round"
      />
      <path
        d="M22 16 L 5 16 L 3 18 L 5 20 L 22 20 Z"
        stroke={colors.gold}
        strokeWidth={1.4}
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  );
}

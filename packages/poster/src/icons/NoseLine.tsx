import { colors } from '../tokens';

interface NoseIconProps {
  size?: number;
}

export function NoseIcon({ size = 28 }: NoseIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path
        d="M14 4 L 14 16 Q 10 20 8 18 Q 6 16 10 14 L 14 16"
        stroke={colors.gold}
        strokeWidth={1.4}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M14 16 Q 18 20 20 18 Q 22 16 18 14 L 14 16"
        stroke={colors.gold}
        strokeWidth={1.4}
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  );
}

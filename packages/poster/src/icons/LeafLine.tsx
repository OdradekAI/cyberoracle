import { colors } from '../tokens';

interface LeafIconProps {
  size?: number;
}

export function LeafIcon({ size = 28 }: LeafIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <path
        d="M6 22 Q 6 8 22 6 Q 22 22 6 22 Z M 6 22 L 18 10"
        stroke={colors.gold}
        strokeWidth={1.4}
        fill="none"
        strokeLinejoin="round"
      />
    </svg>
  );
}

import { colors } from '../tokens';

interface CornerOrnamentProps {
  size?: number;
  variant?: 'tl' | 'tr' | 'bl' | 'br';
}

export function CornerOrnament({ size = 60, variant = 'tl' }: CornerOrnamentProps) {
  const rotation = { tl: 0, tr: 90, br: 180, bl: 270 }[variant];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <path
        d="M5 5 L 25 5 L 25 10 L 10 10 L 10 25 L 5 25 Z M 14 14 L 22 14 L 22 22 L 14 22 Z"
        fill={colors.goldSoft}
      />
    </svg>
  );
}

import type { CSSProperties, ReactNode } from 'react';
import { typography, colors, type ColorToken } from '../tokens';

interface TextProps {
  children: ReactNode;
  size?: keyof typeof typography.size;
  weight?: keyof typeof typography.weight;
  color?: ColorToken;
  lineHeight?: keyof typeof typography.lineHeight;
  letterSpacing?: number;
  align?: CSSProperties['textAlign'];
  asBlock?: boolean;
  style?: CSSProperties;
}

export function Text({
  children,
  size = 'body',
  weight = 'regular',
  color = 'ink',
  lineHeight = 'normal',
  letterSpacing,
  align,
  asBlock,
  style,
}: TextProps) {
  const s: Record<string, unknown> = {
    display: 'flex',
    flexDirection: asBlock ? 'column' : 'row',
    fontFamily: typography.family.serif,
    fontSize: typography.size[size],
    fontWeight: typography.weight[weight],
    color: colors[color],
    lineHeight: typography.lineHeight[lineHeight],
    letterSpacing: letterSpacing ?? 0,
  };
  if (align !== undefined) s.textAlign = align;
  if (style) Object.assign(s, style);

  return <div style={s as CSSProperties}>{children}</div>;
}

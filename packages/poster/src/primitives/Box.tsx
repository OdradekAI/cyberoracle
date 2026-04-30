import type { CSSProperties, ReactNode } from 'react';

interface BoxProps {
  children?: ReactNode;
  direction?: 'row' | 'column';
  justify?: CSSProperties['justifyContent'];
  align?: CSSProperties['alignItems'];
  gap?: number;
  wrap?: boolean;
  flex?: number;
  width?: number | string;
  height?: number | string;
  padding?: number | string;
  paddingX?: number;
  paddingY?: number;
  background?: string;
  borderRadius?: number;
  border?: string;
  style?: CSSProperties;
}

export function Box({
  children,
  direction = 'row',
  justify,
  align,
  gap,
  wrap,
  flex,
  width,
  height,
  padding,
  paddingX,
  paddingY,
  background,
  borderRadius,
  border,
  style,
}: BoxProps) {
  const s: Record<string, unknown> = {
    display: 'flex',
    flexDirection: direction,
    flexWrap: wrap ? 'wrap' : 'nowrap',
  };
  if (justify !== undefined) s.justifyContent = justify;
  if (align !== undefined) s.alignItems = align;
  if (gap !== undefined) s.gap = gap;
  if (flex !== undefined) s.flex = flex;
  if (width !== undefined) s.width = width;
  if (height !== undefined) s.height = height;
  if (padding !== undefined) s.padding = padding;
  if (paddingX !== undefined) {
    s.paddingLeft = paddingX;
    s.paddingRight = paddingX;
  }
  if (paddingY !== undefined) {
    s.paddingTop = paddingY;
    s.paddingBottom = paddingY;
  }
  if (background !== undefined) s.background = background;
  if (borderRadius !== undefined) s.borderRadius = borderRadius;
  if (border !== undefined) s.border = border;
  if (style) Object.assign(s, style);

  return <div style={s as CSSProperties}>{children}</div>;
}

export const brandColors = {
  purple: '#A855F7',
  cyan: '#22D3EE',
  pink: '#F472B6',
} as const;

export const darkColors = {
  bg: '#0B0420',
} as const;

export const posterColors = {
  cream: '#F8F5EE',
  text: '#1F1B16',
  gold: '#9A7B3F',
} as const;

export const semanticColors = {
  primary: brandColors.purple,
  secondary: brandColors.cyan,
  accent: brandColors.pink,
  background: darkColors.bg,
  surface: '#150D30',
  text: '#F8F5EE',
} as const;

export const allColors = {
  brand: brandColors,
  dark: darkColors,
  poster: posterColors,
  semantic: semanticColors,
} as const;

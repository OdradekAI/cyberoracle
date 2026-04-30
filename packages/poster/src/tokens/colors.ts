export const colors = {
  paper: '#F8F5EE',
  paperDeep: '#F1ECE0',
  ink: '#1F1B16',
  inkSoft: '#4A4338',
  inkMuted: '#7A7167',
  gold: '#9A7B3F',
  goldSoft: '#C3A878',
  line: '#E5DFD2',
  accent: '#7A2C2C',
} as const;

export type ColorToken = keyof typeof colors;

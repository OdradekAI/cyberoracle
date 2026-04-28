import type { Config } from 'tailwindcss';
import cyberOraclePreset from '@cyberoracle/tokens/tailwind';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  presets: [cyberOraclePreset],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;

import { brandColors, darkColors, posterColors, semanticColors } from './colors';
import { fontFamilies } from './typography';
import { borderRadius } from './borders';
import { easing, durations } from './animations';

const cyberOraclePreset = {
  theme: {
    extend: {
      colors: {
        brand: brandColors,
        dark: darkColors,
        poster: posterColors,
        semantic: semanticColors,
      },
      fontFamily: {
        notoSerifSC: fontFamilies.notoSerifSC,
        orbitron: fontFamilies.orbitron,
      },
      borderRadius: {
        card: borderRadius.card,
        button: borderRadius.button,
        input: borderRadius.input,
      },
      transitionTimingFunction: {
        default: easing.default,
      },
      transitionDuration: {
        enter: durations.enter,
        exit: durations.exit,
      },
    },
  },
};

export default cyberOraclePreset;

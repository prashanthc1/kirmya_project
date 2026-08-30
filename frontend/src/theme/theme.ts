import { createTheme, Theme } from '@mui/material/styles';
import { getPalette } from './palette';
import { typography } from './typography';
import { spacing } from './spacing';
import { shape } from './shape';
import { breakpoints } from './breakpoints';
import { getShadows } from './shadows';
import { getComponentOverrides } from './components';

export * from './tokens';
export * from './motion';
export * from './palette';
export * from './typography';
export * from './spacing';
export * from './shape';
export * from './breakpoints';
export * from './shadows';
export * from './components';

/**
 * Creates the complete, polished Apple-inspired MUI 6 Theme.
 */
export const getTheme = (mode: 'light' | 'dark'): Theme => {
  return createTheme({
    palette: getPalette(mode),
    typography,
    spacing,
    shape,
    breakpoints,
    shadows: getShadows(mode),
    components: getComponentOverrides(mode),
  });
};

export default getTheme;

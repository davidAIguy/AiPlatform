import { createTheme } from '@mui/material/styles';
import { colorTokens, elevationTokens, typographyTokens } from './tokens';

declare module '@mui/material/styles' {
  interface Theme {
    m3: {
      surfaceContainerLow: string;
      surfaceContainer: string;
      surfaceContainerHigh: string;
      surfaceVariant: string;
      onSurfaceVariant: string;
      success: string;
      onSuccess: string;
      elevation: typeof elevationTokens;
    };
  }

  interface ThemeOptions {
    m3?: {
      surfaceContainerLow?: string;
      surfaceContainer?: string;
      surfaceContainerHigh?: string;
      surfaceVariant?: string;
      onSurfaceVariant?: string;
      success?: string;
      onSuccess?: string;
      elevation?: typeof elevationTokens;
    };
  }
}

const baseTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: colorTokens.primary,
      contrastText: colorTokens.onPrimary,
      light: colorTokens.primaryContainer,
      dark: colorTokens.onPrimaryContainer,
    },
    secondary: {
      main: colorTokens.secondary,
      contrastText: colorTokens.onSecondary,
      light: colorTokens.secondaryContainer,
      dark: colorTokens.onSecondaryContainer,
    },
    background: {
      default: colorTokens.surface,
      paper: colorTokens.surfaceContainerLow,
    },
    text: {
      primary: colorTokens.onSurface,
      secondary: colorTokens.onSurfaceVariant,
    },
    divider: colorTokens.outline,
    error: {
      main: colorTokens.error,
      contrastText: colorTokens.onError,
    },
    success: {
      main: colorTokens.success,
      contrastText: colorTokens.onSuccess,
    },
  },
  typography: {
    fontFamily: typographyTokens.fontFamily,
    h1: typographyTokens.displayLarge,
    h2: typographyTokens.headlineMedium,
    body1: typographyTokens.bodyMedium,
    body2: typographyTokens.bodyMedium,
    overline: typographyTokens.labelSmall,
    button: {
      fontFamily: typographyTokens.fontFamily,
      fontWeight: 580,
      letterSpacing: '0.02em',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 14,
  },
  shadows: [
    elevationTokens.level0,
    elevationTokens.level1,
    elevationTokens.level2,
    elevationTokens.level3,
    elevationTokens.level4,
    elevationTokens.level5,
    elevationTokens.level5,
    elevationTokens.level5,
    elevationTokens.level5,
    elevationTokens.level5,
    elevationTokens.level5,
    elevationTokens.level5,
    elevationTokens.level5,
    elevationTokens.level5,
    elevationTokens.level5,
    elevationTokens.level5,
    elevationTokens.level5,
    elevationTokens.level5,
    elevationTokens.level5,
    elevationTokens.level5,
    elevationTokens.level5,
    elevationTokens.level5,
    elevationTokens.level5,
    elevationTokens.level5,
    elevationTokens.level5,
  ],
  m3: {
    surfaceContainerLow: colorTokens.surfaceContainerLow,
    surfaceContainer: colorTokens.surfaceContainer,
    surfaceContainerHigh: colorTokens.surfaceContainerHigh,
    surfaceVariant: colorTokens.surfaceVariant,
    onSurfaceVariant: colorTokens.onSurfaceVariant,
    success: colorTokens.success,
    onSuccess: colorTokens.onSuccess,
    elevation: elevationTokens,
  },
});

export const appTheme = createTheme(baseTheme, {
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          borderColor: baseTheme.palette.divider,
          backgroundColor: baseTheme.m3.surfaceContainerLow,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: '1.15rem',
          minHeight: 40,
          transition: 'background-color 120ms ease, box-shadow 120ms ease',
          '&:hover': {
            boxShadow: baseTheme.m3.elevation.level1,
          },
          '&:active': {
            boxShadow: baseTheme.m3.elevation.level0,
          },
          '&.Mui-focusVisible': {
            outline: `2px solid ${baseTheme.palette.primary.main}`,
            outlineOffset: '2px',
          },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: baseTheme.m3.elevation.level3,
          '&:hover': {
            boxShadow: baseTheme.m3.elevation.level4,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: baseTheme.m3.surfaceContainerLow,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: baseTheme.palette.primary.main,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          letterSpacing: '0.02em',
        },
      },
    },
  },
});

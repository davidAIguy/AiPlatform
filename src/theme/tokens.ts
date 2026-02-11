export const colorTokens = {
  primary: 'hsl(209 100% 36%)',
  onPrimary: 'hsl(0 0% 100%)',
  primaryContainer: 'hsl(210 100% 92%)',
  onPrimaryContainer: 'hsl(212 100% 18%)',
  secondary: 'hsl(214 19% 43%)',
  onSecondary: 'hsl(0 0% 100%)',
  secondaryContainer: 'hsl(213 37% 90%)',
  onSecondaryContainer: 'hsl(215 47% 14%)',
  surface: 'hsl(225 100% 99%)',
  surfaceContainerLow: 'hsl(220 39% 97%)',
  surfaceContainer: 'hsl(223 28% 94%)',
  surfaceContainerHigh: 'hsl(223 22% 91%)',
  surfaceVariant: 'hsl(220 27% 90%)',
  onSurface: 'hsl(228 18% 17%)',
  onSurfaceVariant: 'hsl(220 12% 37%)',
  outline: 'hsl(220 12% 58%)',
  success: 'hsl(137 43% 36%)',
  onSuccess: 'hsl(0 0% 100%)',
  error: 'hsl(3 76% 43%)',
  onError: 'hsl(0 0% 100%)',
} as const;

export const typographyTokens = {
  fontFamily: '"Roboto Flex", "Roboto", sans-serif',
  displayLarge: {
    fontSize: '2.25rem',
    lineHeight: 1.16,
    fontWeight: 600,
    letterSpacing: '-0.02em',
  },
  headlineMedium: {
    fontSize: '1.5rem',
    lineHeight: 1.25,
    fontWeight: 560,
    letterSpacing: '-0.01em',
  },
  bodyMedium: {
    fontSize: '0.95rem',
    lineHeight: 1.5,
    fontWeight: 420,
    letterSpacing: '0.01em',
  },
  labelSmall: {
    fontSize: '0.75rem',
    lineHeight: 1.35,
    fontWeight: 600,
    letterSpacing: '0.03em',
    textTransform: 'uppercase' as const,
  },
} as const;

export const elevationTokens = {
  level0: 'none',
  level1: '0 1px 2px hsl(220 20% 20% / 0.12)',
  level2: '0 2px 4px hsl(220 20% 20% / 0.14)',
  level3: '0 4px 8px hsl(220 20% 20% / 0.16)',
  level4: '0 8px 16px hsl(220 20% 20% / 0.18)',
  level5: '0 12px 24px hsl(220 20% 20% / 0.2)',
} as const;

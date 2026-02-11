import { Chip } from '@mui/material';
import { useTheme } from '@mui/material/styles';

type StatusTone = 'active' | 'offline' | 'error' | 'completed' | 'busy' | 'failed' | 'positive' | 'neutral' | 'negative';

interface StatusChipProps {
  label: string;
  tone: StatusTone;
}

export function StatusChip({ label, tone }: StatusChipProps) {
  const theme = useTheme();

  const toneStyles: Record<StatusTone, { background: string; text: string; border: string }> = {
    active: {
      background: theme.palette.success.light,
      text: theme.palette.success.dark,
      border: theme.palette.success.main,
    },
    completed: {
      background: theme.palette.success.light,
      text: theme.palette.success.dark,
      border: theme.palette.success.main,
    },
    positive: {
      background: theme.palette.success.light,
      text: theme.palette.success.dark,
      border: theme.palette.success.main,
    },
    offline: {
      background: theme.m3.surfaceVariant,
      text: theme.palette.text.secondary,
      border: theme.palette.divider,
    },
    neutral: {
      background: theme.m3.surfaceVariant,
      text: theme.palette.text.secondary,
      border: theme.palette.divider,
    },
    busy: {
      background: theme.palette.warning.light,
      text: theme.palette.warning.dark,
      border: theme.palette.warning.main,
    },
    error: {
      background: theme.palette.error.light,
      text: theme.palette.error.dark,
      border: theme.palette.error.main,
    },
    failed: {
      background: theme.palette.error.light,
      text: theme.palette.error.dark,
      border: theme.palette.error.main,
    },
    negative: {
      background: theme.palette.error.light,
      text: theme.palette.error.dark,
      border: theme.palette.error.main,
    },
  };

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        backgroundColor: toneStyles[tone].background,
        color: toneStyles[tone].text,
        border: `1px solid ${toneStyles[tone].border}`,
        fontSize: '0.79rem',
        height: 26,
        '& .MuiChip-label': {
          px: 1.1,
        },
      }}
    />
  );
}

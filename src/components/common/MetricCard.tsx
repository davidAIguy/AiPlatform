import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { Card, CardContent, Stack, Typography } from '@mui/material';

interface MetricCardProps {
  label: string;
  value: string;
  helper: string;
}

export function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.1}>
          <Typography variant="overline" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h2">{value}</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <TrendingUpRoundedIcon fontSize="small" color="primary" />
            <Typography variant="body2" color="text.secondary">
              {helper}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

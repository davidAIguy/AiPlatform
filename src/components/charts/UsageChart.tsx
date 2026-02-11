import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { UsagePoint } from '../../types/domain';

interface UsageChartProps {
  data: UsagePoint[];
}

export function UsageChart({ data }: UsageChartProps) {
  const theme = useTheme();
  const maxMinutes = Math.max(...data.map((point) => point.minutes));

  return (
    <Card elevation={2}>
      <CardContent>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="overline" color="text.secondary">
              Total Minutes Used
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last seven days across all organizations
            </Typography>
          </Box>

          <Stack direction="row" alignItems="end" justifyContent="space-between" sx={{ minHeight: 196 }}>
            {data.map((point) => {
              const ratio = point.minutes / maxMinutes;

              return (
                <Stack key={point.day} alignItems="center" spacing={1} sx={{ flex: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {point.minutes}m
                  </Typography>
                  <Box
                    sx={{
                      width: { xs: 18, sm: 28 },
                      borderRadius: 999,
                      height: `${Math.max(22, ratio * 138)}px`,
                      background: `linear-gradient(180deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                      boxShadow: theme.m3.elevation.level1,
                      transition: 'filter 140ms ease, transform 140ms ease',
                      '&:hover': {
                        filter: 'saturate(1.15)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {point.day}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import KeyboardArrowLeftRoundedIcon from '@mui/icons-material/KeyboardArrowLeftRounded';
import KeyboardArrowRightRoundedIcon from '@mui/icons-material/KeyboardArrowRightRounded';
import SmartToyRoundedIcon from '@mui/icons-material/SmartToyRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';
import TimerRoundedIcon from '@mui/icons-material/TimerRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid2,
  Paper,
  Radio,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { StatusChip } from '../components/common/StatusChip';
import { getDashboardOverview } from '../lib/api';
import { DashboardOverview } from '../types/domain';

export function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const nextOverview = await getDashboardOverview();

        if (!active) {
          return;
        }

        setOverview(nextOverview);
        setError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }

        const message = loadError instanceof Error ? loadError.message : 'Unexpected error while loading dashboard data.';
        setError(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const kpi = overview?.kpi;
  const recentSessions = overview?.recentSessions ?? [];

  return (
    <AppLayout
      title="System Overview"
      subtitle="Real-time metrics for VoiceNexus Orchestration Engine"
      topBar={{ breadcrumbRoot: 'Home', breadcrumbCurrent: 'Dashboard', searchPlaceholder: 'Search sessions...' }}
      headerAction={
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} width={{ xs: '100%', sm: 'auto' }}>
          <Button variant="outlined" size="small" sx={{ width: { xs: '100%', sm: 'auto' } }}>
            Last 24 Hours
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadRoundedIcon />}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Export PDF
          </Button>
        </Stack>
      }
    >
      {loading ? (
        <Stack alignItems="center" justifyContent="center" py={4}>
          <CircularProgress size={28} />
        </Stack>
      ) : null}

      {error ? (
        <Alert severity="error" sx={{ mb: 2.2 }}>
          {error}
        </Alert>
      ) : null}

      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        <Grid2 container spacing={{ xs: 1.4, md: 2 }}>
        <Grid2 size={{ xs: 12, sm: 6, xl: 3 }}>
          <KpiCard
            label="Total Clients"
            value={String(kpi?.totalClients ?? 0)}
            helper="+12%"
            helperTone="success"
            icon={<BusinessRoundedIcon color="primary" />}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6, xl: 3 }}>
          <KpiCard
            label="Active Agents"
            value={String(kpi?.activeAgents ?? 0)}
            helper="live"
            helperTone="neutral"
            icon={<SmartToyRoundedIcon color="primary" />}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6, xl: 3 }}>
          <KpiCard
            label="Total Minutes"
            value={(kpi?.totalMinutes ?? 0).toLocaleString()}
            helper="m"
            helperTone="neutral"
            icon={<TimerRoundedIcon color="primary" />}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, sm: 6, xl: 3 }}>
          <KpiCard
            label="System Latency"
            value={String(kpi?.systemLatencyMs ?? 0)}
            helper="ms"
            helperTone="neutral"
            status={{ label: kpi?.healthy ? '● Healthy' : '● Attention', tone: kpi?.healthy ? 'active' : 'busy' }}
            icon={<SpeedRoundedIcon color="primary" />}
          />
        </Grid2>

        <Grid2 size={{ xs: 12 }}>
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 0 }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                px={{ xs: 2, md: 3 }}
                py={{ xs: 1.8, md: 2.3 }}
                borderBottom={(theme) => `1px solid ${theme.palette.divider}`}
                gap={1}
              >
                <Typography variant="h6">Recent Sessions</Typography>
                <Stack direction="row" spacing={1.6}>
                  <Button size="small" startIcon={<FilterListRoundedIcon />}>
                    Filter
                  </Button>
                  <Button size="small" startIcon={<DownloadRoundedIcon />}>
                    Export CSV
                  </Button>
                </Stack>
              </Stack>

              <TableContainer component={Paper} elevation={0}>
                <Table sx={{ minWidth: 860 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <Radio size="small" />
                      </TableCell>
                      <TableCell sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem' }}>Client</TableCell>
                      <TableCell sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem' }}>Agent ID</TableCell>
                      <TableCell sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem' }}>Start Time</TableCell>
                      <TableCell sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem' }}>Duration</TableCell>
                      <TableCell sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem' }}>Status</TableCell>
                      <TableCell align="right" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem' }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentSessions.map((row) => (
                      <TableRow key={row.agentId} hover sx={{ '& td': { py: 2.2 } }}>
                        <TableCell padding="checkbox">
                          <Radio size="small" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" fontWeight={560}>
                            {row.client}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {row.plan}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                            {row.agentId}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.startTime}</TableCell>
                        <TableCell>{row.duration}</TableCell>
                        <TableCell>
                          <StatusChip
                            label={row.status === 'Active' ? 'Active ●' : row.status}
                            tone={row.status === 'Completed' ? 'completed' : row.status === 'Failed' ? 'failed' : 'active'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button size="small" sx={{ color: 'primary.main' }}>
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                px={{ xs: 2, md: 3 }}
                py={1.8}
                borderTop={(theme) => `1px solid ${theme.palette.divider}`}
              >
                <Typography variant="body2" color="text.secondary">
                  Showing 1-{recentSessions.length} recent sessions
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button size="small" disabled sx={{ minWidth: 34 }}>
                    <KeyboardArrowLeftRoundedIcon fontSize="small" />
                  </Button>
                  <Button size="small" variant="outlined" sx={{ minWidth: 34 }}>
                    1
                  </Button>
                  <Button size="small" sx={{ minWidth: 34 }}>
                    2
                  </Button>
                  <Button size="small" sx={{ minWidth: 34 }}>
                    3
                  </Button>
                  <Typography variant="body2" color="text.secondary">
                    ...
                  </Typography>
                  <Button size="small" sx={{ minWidth: 34 }}>
                    <KeyboardArrowRightRoundedIcon fontSize="small" />
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid2>
        </Grid2>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={1}
          mt={{ xs: 3.5, md: 5 }}
          pt={2.5}
          borderTop={(theme) => `1px solid ${theme.palette.divider}`}
        >
          <Typography variant="body2" color="text.secondary">
            © 2024 VoiceNexus AI Inc.
          </Typography>
          <Stack direction="row" spacing={{ xs: 0.6, sm: 2.2 }} flexWrap="wrap">
            <Button size="small">Privacy Policy</Button>
            <Button size="small">Terms of Service</Button>
            <Button size="small">Support</Button>
          </Stack>
        </Stack>
      </Box>
    </AppLayout>
  );
}

interface KpiCardProps {
  label: string;
  value: string;
  helper: string;
  helperTone: 'success' | 'neutral';
  icon: JSX.Element;
  status?: {
    label: string;
    tone: 'active' | 'busy';
  };
}

function KpiCard({ label, value, helper, helperTone, icon, status }: KpiCardProps) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3, minHeight: { xs: 126, md: 146 } }}>
      <CardContent sx={{ p: { xs: 2.1, md: 2.8 } }}>
        <Stack spacing={{ xs: 1.8, md: 2.6 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="overline" color="text.secondary">
              {label}
            </Typography>
            {icon}
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 650,
                fontSize: { xs: '1.9rem', sm: '2.15rem', md: '2.3rem' },
                lineHeight: 1,
              }}
            >
              {value}
            </Typography>
            <Typography
              variant="body2"
              color={helperTone === 'success' ? 'success.main' : 'text.secondary'}
              sx={
                helperTone === 'success'
                  ? {
                      px: 0.8,
                      py: 0.2,
                      borderRadius: 4,
                      bgcolor: 'success.light',
                    }
                  : undefined
              }
            >
              {helper}
            </Typography>

            {status ? <StatusChip label={status.label} tone={status.tone} /> : null}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

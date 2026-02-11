import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import SpaceDashboardRoundedIcon from '@mui/icons-material/SpaceDashboardRounded';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid2,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatusChip } from '../components/common/StatusChip';
import { listAgents, listCalls } from '../lib/api';
import { Agent, CallSession } from '../types/domain';

type LogStatus = 'success' | 'flagged' | 'failed';

interface LogRow {
  id: string;
  date: string;
  time: string;
  client: string;
  agentName: string;
  clientId: string;
  duration: string;
  durationSeconds: number;
  status: LogStatus;
  sentiment: CallSession['sentiment'];
  model: string;
  recordingUrl: string;
  initials: string;
  accent: 'primary' | 'warning' | 'secondary';
}

function formatDuration(durationSeconds: number): string {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

function formatDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function formatTime(timeString: string): string {
  const [rawHours = '0', rawMinutes = '00'] = timeString.split(':');
  const hours = Number(rawHours);

  if (Number.isNaN(hours)) {
    return timeString;
  }

  const isPm = hours >= 12;
  const normalizedHours = hours % 12 === 0 ? 12 : hours % 12;

  return `${String(normalizedHours).padStart(2, '0')}:${rawMinutes} ${isPm ? 'PM' : 'AM'}`;
}

function getInitials(label: string): string {
  const parts = label
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return 'NA';
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function toLogStatus(status: CallSession['status']): LogStatus {
  if (status === 'completed') {
    return 'success';
  }

  if (status === 'busy') {
    return 'flagged';
  }

  return 'failed';
}

function toAccent(status: CallSession['status']): LogRow['accent'] {
  if (status === 'completed') {
    return 'primary';
  }

  if (status === 'busy') {
    return 'warning';
  }

  return 'secondary';
}

const transcriptRows = [
  {
    role: 'AI',
    time: '00:00',
    message: 'Thank you for calling Global Solutions support. My name is Nexus. How can I assist you today?',
  },
  {
    role: 'U',
    time: '00:08',
    message: "Hi, I'm having trouble logging into my dashboard. It keeps saying Invalid Credentials even after reset.",
  },
  {
    role: 'AI',
    time: '00:15',
    message: 'I understand how frustrating that can be. Can you confirm the email associated with your account?',
  },
];

const leftNav = [
  { label: 'Dashboard', path: '/dashboard', icon: <SpaceDashboardRoundedIcon /> },
  { label: 'Call Logs', path: '/call-logs', icon: <ListAltRoundedIcon /> },
  { label: 'Clients', path: '/clients', icon: <GroupsRoundedIcon /> },
  { label: 'Settings', path: '/settings', icon: <SettingsRoundedIcon /> },
];

export function CallLogsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [expandedRowId, setExpandedRowId] = useState('');
  const [logRows, setLogRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);

    try {
      const [calls, agents] = await Promise.all([listCalls({ limit: 200 }), listAgents()]);
      const agentByName = new Map<string, Agent>(agents.map((agent) => [agent.name, agent]));

      const mappedRows = calls.map((call) => {
        const [datePart = '', timePart = ''] = call.startedAt.split(' ');
        const agent = agentByName.get(call.agentName);
        const client = agent?.organizationName ?? call.agentName;

        return {
          id: call.id,
          date: datePart ? formatDate(datePart) : call.startedAt,
          time: timePart ? formatTime(timePart) : '--:--',
          client,
          agentName: call.agentName,
          clientId: `#${call.id.replace(/\D/g, '').padStart(6, '0')}`,
          duration: formatDuration(call.durationSeconds),
          durationSeconds: call.durationSeconds,
          status: toLogStatus(call.status),
          sentiment: call.sentiment,
          model: agent?.model ?? 'n/a',
          recordingUrl: call.recordingUrl,
          initials: getInitials(client),
          accent: toAccent(call.status),
        } satisfies LogRow;
      });

      setLogRows(mappedRows);
      setExpandedRowId((prev) => {
        if (prev && mappedRows.some((row) => row.id === prev)) {
          return prev;
        }

        return mappedRows[0]?.id ?? '';
      });
      setError(null);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Unexpected error while loading call logs.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (normalized.length === 0) {
      return logRows;
    }

    return logRows.filter((row) =>
      [row.client, row.agentName, row.clientId, row.date, row.time].some((value) => value.toLowerCase().includes(normalized)),
    );
  }, [query, logRows]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh', bgcolor: 'background.default' }}>
      <Paper
        elevation={0}
        sx={{
          width: { xs: 0, md: 288 },
          borderRight: (theme) => `1px solid ${theme.palette.divider}`,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" px={3} py={2.8}>
          <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 700 }}>V</Avatar>
          <Typography variant="h5" fontWeight={700}>
            VoiceNexus
          </Typography>
        </Stack>

        <Stack spacing={0.7} px={2}>
          {leftNav.map((item) => {
            const selected = item.path === '/call-logs';

            return (
              <Button
                key={item.path}
                onClick={() => navigate(item.path)}
                startIcon={item.icon}
                sx={{
                  justifyContent: 'flex-start',
                  py: 1.2,
                  px: 1.8,
                  borderRadius: 3,
                  color: selected ? 'primary.main' : 'text.primary',
                  bgcolor: selected ? 'primary.light' : 'transparent',
                  fontWeight: selected ? 620 : 500,
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Stack>

        <Box sx={{ flex: 1 }} />

        <Divider />

        <Stack direction="row" spacing={1.3} alignItems="center" px={3} py={2.2}>
          <Avatar sx={{ width: 38, height: 38 }}>JD</Avatar>
          <Stack>
            <Typography variant="body1" fontWeight={560}>
              John Doe
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Admin
            </Typography>
          </Stack>
        </Stack>
      </Paper>

      <Box component="main" sx={{ flex: 1, px: { xs: 1.5, md: 3.25 }, py: { xs: 2.2, md: 3 } }}>
        <Box sx={{ maxWidth: 1320, mx: 'auto' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          gap={2}
          mb={2.5}
        >
          <Stack spacing={0.3}>
            <Typography variant="h2">Call Logs &amp; Details</Typography>
            <Typography variant="body2" color="text.secondary">
              Review and audit voice interactions across all clients.
            </Typography>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} width={{ xs: '100%', sm: 'auto' }}>
            <Button variant="outlined" startIcon={<DownloadRoundedIcon />} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              Export CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<RefreshRoundedIcon />}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
              onClick={loadLogs}
              disabled={loading}
            >
              Refresh
            </Button>
          </Stack>
        </Stack>

        {loading ? (
          <Stack alignItems="center" justifyContent="center" py={2.6}>
            <CircularProgress size={24} />
          </Stack>
        ) : null}

        {error ? (
          <Alert severity="error" sx={{ mb: 2.2 }}>
            {error}
          </Alert>
        ) : null}

        <Paper variant="outlined" sx={{ borderRadius: 4, p: { xs: 1.3, md: 2 }, mb: 2.5 }}>
          <Grid2 container spacing={1.1} alignItems="center">
            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by Client ID or Phone..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                InputProps={{ startAdornment: <SearchRoundedIcon fontSize="small" sx={{ mr: 1 }} /> }}
              />
            </Grid2>

            <Grid2 size={{ xs: 6, md: 2.4 }}>
              <Button variant="outlined" fullWidth startIcon={<CalendarTodayRoundedIcon />} endIcon={<KeyboardArrowDownRoundedIcon />}>
                Last 7 Days
              </Button>
            </Grid2>

            <Grid2 size={{ xs: 6, md: 2 }}>
              <Button variant="outlined" fullWidth endIcon={<KeyboardArrowDownRoundedIcon />}>
                Completed
              </Button>
            </Grid2>

            <Grid2 size={{ xs: 12, md: 1.6 }}>
              <Button fullWidth>Clear</Button>
            </Grid2>
          </Grid2>
        </Paper>

        <Grid2 container sx={{ px: { xs: 0, md: 2 }, pb: 1.1, display: { xs: 'none', md: 'flex' } }}>
          <Grid2 size={{ xs: 12, md: 3 }}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.08em' }}>
              Timestamp
            </Typography>
          </Grid2>
          <Grid2 size={{ xs: 12, md: 3 }}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.08em' }}>
              Client
            </Typography>
          </Grid2>
          <Grid2 size={{ xs: 12, md: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.08em' }}>
              Duration
            </Typography>
          </Grid2>
          <Grid2 size={{ xs: 12, md: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.08em' }}>
              Status
            </Typography>
          </Grid2>
          <Grid2 size={{ xs: 12, md: 2 }}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: '0.08em' }} textAlign="right">
              Actions
            </Typography>
          </Grid2>
        </Grid2>

        <Stack spacing={1.6}>
          {rows.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="body2" color="text.secondary">
                No call logs found for the current filters.
              </Typography>
            </Paper>
          ) : null}

          {rows.map((row) => {
            const expanded = expandedRowId === row.id;

            return (
                <Card
                  key={row.id}
                  variant="outlined"
                  sx={{
                  borderRadius: 3,
                  borderColor: expanded ? 'primary.light' : undefined,
                  boxShadow: expanded ? 1 : 0,
                }}
              >
                <CardContent sx={{ px: { xs: 1.6, md: 2.5 }, py: { xs: 1.6, md: 2.1 } }}>
                  <Grid2 container spacing={1} alignItems="center">
                    <Grid2 size={{ xs: 12, md: 3 }}>
                      <Typography variant="h6" sx={{ fontSize: '1.15rem' }}>
                        {row.date}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {row.time}
                      </Typography>
                    </Grid2>

                    <Grid2 size={{ xs: 12, md: 3 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: row.accent === 'warning' ? 'warning.light' : row.accent === 'secondary' ? 'secondary.light' : 'primary.light',
                            color: row.accent === 'warning' ? 'warning.dark' : row.accent === 'secondary' ? 'secondary.dark' : 'primary.dark',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                          }}
                        >
                          {row.initials}
                        </Avatar>
                        <Stack>
                          <Typography variant="body1" fontWeight={560}>
                            {row.client}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ID: {row.clientId}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Grid2>

                    <Grid2 size={{ xs: 12, md: 2 }}>
                      <Typography variant="body1" sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                        {row.duration}
                      </Typography>
                    </Grid2>

                    <Grid2 size={{ xs: 8, md: 2 }}>
                      <StatusChip
                        label={row.status === 'success' ? 'Success' : row.status === 'flagged' ? 'Flagged' : 'Failed'}
                        tone={row.status === 'success' ? 'completed' : row.status === 'flagged' ? 'busy' : 'failed'}
                      />
                    </Grid2>

                    <Grid2 size={{ xs: 4, md: 2 }}>
                      <Stack direction="row" justifyContent="flex-end">
                        <IconButton
                          onClick={() => setExpandedRowId(expanded ? '' : row.id)}
                          sx={{ bgcolor: expanded ? 'primary.light' : 'transparent' }}
                        >
                          {expanded ? <ExpandLessRoundedIcon color="primary" /> : <ExpandMoreRoundedIcon />}
                        </IconButton>
                      </Stack>
                    </Grid2>
                  </Grid2>

                  {expanded ? (
                    <>
                      <Divider sx={{ my: 2 }} />

                      <Grid2 container spacing={2.4}>
                        <Grid2 size={{ xs: 12, lg: 8 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.2}>
                            <Typography variant="overline" sx={{ letterSpacing: '0.08em' }}>
                              Transcript
                            </Typography>
                            <Button size="small">Copy</Button>
                          </Stack>

                          <Paper
                            variant="outlined"
                            sx={{ p: { xs: 1.2, md: 2 }, borderRadius: 3, maxHeight: { xs: 290, md: 430 }, overflowY: 'auto' }}
                          >
                            <Stack spacing={1.35}>
                              {transcriptRows.map((item) => {
                                const isAI = item.role === 'AI';

                                return (
                                  <Stack key={`${item.role}-${item.time}`} spacing={0.45} alignItems={isAI ? 'flex-start' : 'flex-end'}>
                                    <Typography variant="caption" color="text.secondary">
                                      {item.role} {item.time}
                                    </Typography>
                                    <Paper
                                      variant="outlined"
                                      sx={{
                                        py: 1.2,
                                        px: 1.6,
                                        borderRadius: 2.4,
                                        maxWidth: '92%',
                                        bgcolor: isAI ? 'background.paper' : 'primary.light',
                                      }}
                                    >
                                      <Typography variant="body1">{item.message}</Typography>
                                    </Paper>
                                  </Stack>
                                );
                              })}
                            </Stack>
                          </Paper>
                        </Grid2>

                        <Grid2 size={{ xs: 12, lg: 4 }}>
                          <Stack spacing={1.2}>
                            <Paper
                              sx={{
                                p: 2,
                                borderRadius: 4,
                                background: (theme) => `linear-gradient(160deg, ${theme.palette.primary.dark}, ${theme.palette.text.primary})`,
                                color: 'background.default',
                              }}
                            >
                              <Stack direction="row" justifyContent="space-between" mb={1.4}>
                                <Typography variant="body2" sx={{ opacity: 0.86 }}>
                                  Recording
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.86 }}>
                                  24kbps - Mono
                                </Typography>
                              </Stack>

                              <Stack direction="row" spacing={0.35} alignItems="center" mb={1.8}>
                                {[3, 8, 13, 9, 5, 11, 15, 9, 4, 7, 5, 10, 7, 4].map((height, index) => (
                                  <Box
                                    key={`${height}-${index}`}
                                    sx={{
                                      width: 4,
                                      height: `${height * 2}px`,
                                      borderRadius: 2,
                                      bgcolor: index < 6 ? 'primary.main' : 'primary.light',
                                      opacity: index < 6 ? 1 : 0.45,
                                    }}
                                  />
                                ))}
                              </Stack>

                              <Stack direction="row" spacing={1.1} alignItems="center">
                                <IconButton size="small" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                                  <PlayArrowRoundedIcon fontSize="small" />
                                </IconButton>
                                <Box sx={{ flex: 1, height: 4, borderRadius: 999, bgcolor: 'background.default' }}>
                                  <Box sx={{ width: '38%', height: '100%', borderRadius: 999, bgcolor: 'primary.main' }} />
                                </Box>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                  00:00 / {row.duration}
                                </Typography>
                              </Stack>

                              <Box mt={1.4}>
                                <audio controls src={row.recordingUrl} style={{ width: '100%' }} />
                              </Box>
                            </Paper>

                            <Grid2 container spacing={1}>
                              <Grid2 size={6}>
                                <Paper variant="outlined" sx={{ p: 1.4, borderRadius: 3 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Sentiment
                                  </Typography>
                                  <Typography
                                    variant="h6"
                                    color={
                                      row.sentiment === 'positive'
                                        ? 'success.main'
                                        : row.sentiment === 'neutral'
                                          ? 'warning.main'
                                          : 'error.main'
                                    }
                                  >
                                    {row.sentiment[0]?.toUpperCase()}
                                    {row.sentiment.slice(1)}
                                  </Typography>
                                </Paper>
                              </Grid2>

                              <Grid2 size={6}>
                                <Paper variant="outlined" sx={{ p: 1.4, borderRadius: 3 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Cost
                                  </Typography>
                                  <Typography variant="h6">${(row.durationSeconds * 0.0007).toFixed(2)}</Typography>
                                </Paper>
                              </Grid2>

                              <Grid2 size={12}>
                                <Paper variant="outlined" sx={{ p: 1.4, borderRadius: 3 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    Model Version
                                  </Typography>
                                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="h6">{row.model}</Typography>
                                    <VersionBadge label="v2.1.0" />
                                  </Stack>
                                </Paper>
                              </Grid2>
                            </Grid2>

                            <Button variant="outlined" fullWidth>
                              View Full Analytics
                            </Button>
                          </Stack>
                        </Grid2>
                      </Grid2>
                    </>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </Stack>
        </Box>
      </Box>
    </Box>
  );
}

interface VersionBadgeProps {
  label: string;
}

function VersionBadge({ label }: VersionBadgeProps) {
  return (
    <Paper variant="outlined" sx={{ px: 0.8, py: 0.15, borderRadius: 3 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Paper>
  );
}

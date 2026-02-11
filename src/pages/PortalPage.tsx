import { Alert, Button, Card, CardContent, CircularProgress, Divider, Grid2, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { StatusChip } from '../components/common/StatusChip';
import { listAgents, listCalls } from '../lib/api';
import { Agent, CallSession } from '../types/domain';

export function PortalPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [callSessions, setCallSessions] = useState<CallSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [nextAgents, nextCalls] = await Promise.all([listAgents(), listCalls({ limit: 100 })]);

        if (!active) {
          return;
        }

        setAgents(nextAgents);
        setCallSessions(nextCalls);
        setError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }

        const message = loadError instanceof Error ? loadError.message : 'Unexpected error while loading portal data.';
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
  }, [reloadToken]);

  const portalAgent = useMemo(() => {
    const preferred = agents.find((agent) => agent.organizationName === 'Dental Clinic X');
    return preferred ?? agents[0];
  }, [agents]);

  if (!portalAgent) {
    return (
      <AppLayout
        title="Client Portal"
        subtitle="Read-only transparency dashboard designed for business owners and managers."
      >
        {loading ? (
          <Stack alignItems="center" justifyContent="center" py={4}>
            <CircularProgress size={28} />
          </Stack>
        ) : null}

        <Typography variant="body2" color="text.secondary">
          {error ? `Unable to load portal data: ${error}` : loading ? 'Loading portal data...' : 'No agent data available yet.'}
        </Typography>
      </AppLayout>
    );
  }

  const recentCalls = callSessions.filter((call) => call.agentName === portalAgent.name).slice(0, 3);

  return (
    <AppLayout
      title="Client Portal"
      subtitle="Read-only transparency dashboard designed for business owners and managers."
    >
      {loading ? (
        <Stack alignItems="center" justifyContent="center" py={8}>
          <CircularProgress size={28} />
        </Stack>
      ) : null}

      {error ? (
        <Alert
          severity="error"
          sx={{ mb: 2.2 }}
          action={
            <Button color="inherit" size="small" onClick={() => setReloadToken((current) => current + 1)}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : null}

      <Grid2 container spacing={2.2}>
        <Grid2 size={{ xs: 12, lg: 5 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={1.6}>
                <Typography variant="overline" color="text.secondary">
                  Active Agent
                </Typography>

                <Typography variant="h6">{portalAgent.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {portalAgent.organizationName}
                </Typography>

                <Stack direction="row" spacing={1}>
                  <StatusChip
                    label={portalAgent.status}
                    tone={portalAgent.status === 'active' ? 'active' : portalAgent.status === 'offline' ? 'offline' : 'error'}
                  />
                  <StatusChip label="Twilio Connected" tone="active" />
                </Stack>

                <Divider />

                <Stack spacing={1}>
                  <Info label="Voice Profile" value={portalAgent.voiceId} />
                  <Info label="Average Latency" value={`${portalAgent.averageLatencyMs} ms`} />
                  <Info label="Phone Number" value={portalAgent.twilioNumber} />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid2>

        <Grid2 size={{ xs: 12, lg: 7 }}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="overline" color="text.secondary">
                  Recent Recordings
                </Typography>

                {recentCalls.map((call, index) => (
                  <Stack key={call.id} spacing={1}>
                    {index > 0 ? <Divider /> : null}
                    <Stack spacing={0.7}>
                      <Typography variant="body1" fontWeight={550}>
                        {call.startedAt} - {call.callerNumber}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <StatusChip
                          label={call.status}
                          tone={call.status === 'completed' ? 'completed' : call.status === 'busy' ? 'busy' : 'failed'}
                        />
                        <StatusChip
                          label={call.sentiment}
                          tone={call.sentiment === 'positive' ? 'positive' : call.sentiment === 'neutral' ? 'neutral' : 'negative'}
                        />
                      </Stack>
                      <audio controls src={call.recordingUrl} style={{ width: '100%' }} />
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid2>
      </Grid2>
    </AppLayout>
  );
}

interface InfoProps {
  label: string;
  value: string;
}

function Info({ label, value }: InfoProps) {
  return (
    <Stack direction="row" justifyContent="space-between" gap={1}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={560}>
        {value}
      </Typography>
    </Stack>
  );
}

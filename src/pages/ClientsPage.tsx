import { Alert, Button, Card, CardContent, CircularProgress, Divider, Grid2, Stack, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { OrganizationCard } from '../components/clients/OrganizationCard';
import { AppLayout } from '../components/layout/AppLayout';
import { StatusChip } from '../components/common/StatusChip';
import { listAgents, listOrganizations } from '../lib/api';
import { Agent, Organization } from '../types/domain';

export function ClientsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [nextOrganizations, nextAgents] = await Promise.all([listOrganizations(), listAgents()]);

        if (!active) {
          return;
        }

        setOrganizations(nextOrganizations);
        setAgents(nextAgents);
        setError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }

        const message = loadError instanceof Error ? loadError.message : 'Unexpected error while loading organizations.';
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

  return (
    <AppLayout
      title="Client Organizations"
      subtitle="Manage portfolio visibility and assignment of AI voice agents by account."
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
        <Grid2 size={{ xs: 12, lg: 7 }}>
          <Grid2 container spacing={2}>
            {organizations.map((organization) => (
              <Grid2 key={organization.id} size={{ xs: 12, sm: 6 }}>
                <OrganizationCard organization={organization} />
              </Grid2>
            ))}
          </Grid2>
        </Grid2>

        <Grid2 size={{ xs: 12, lg: 5 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="overline" color="text.secondary">
                  Agent Assignment Matrix
                </Typography>

                {agents.map((agent, index) => (
                  <Stack key={agent.id} spacing={1}>
                    {index > 0 ? <Divider /> : null}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1.3}>
                      <Stack>
                        <Typography variant="body1" fontWeight={550}>
                          {agent.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {agent.organizationName}
                        </Typography>
                      </Stack>
                      <StatusChip
                        label={agent.status}
                        tone={agent.status === 'active' ? 'active' : agent.status === 'offline' ? 'offline' : 'error'}
                      />
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

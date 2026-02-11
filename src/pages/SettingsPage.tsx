import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid2,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { StatusChip } from '../components/common/StatusChip';
import { getPlatformSettings, updatePlatformSettings } from '../lib/api';
import { PlatformSettings } from '../types/domain';

export function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      setLoading(true);

      try {
        const nextSettings = await getPlatformSettings();

        if (!active) {
          return;
        }

        setSettings(nextSettings);
        setLoadError(null);
      } catch (error) {
        if (!active) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Unexpected error while loading platform settings.';
        setLoadError(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, [reloadToken]);

  const integrationRows = useMemo(() => {
    if (!settings) {
      return [];
    }

    return [
      { label: 'OpenAI', tone: settings.openaiApiKey.trim() ? 'active' : 'error' },
      { label: 'Deepgram', tone: settings.deepgramApiKey.trim() ? 'active' : 'error' },
      { label: 'Twilio', tone: settings.twilioAccountSid.trim() ? 'active' : 'error' },
      { label: 'Rime', tone: settings.rimeApiKey.trim() ? 'active' : 'error' },
    ] as const;
  }, [settings]);

  function updateField<K extends keyof PlatformSettings>(field: K, value: PlatformSettings[K]) {
    setSettings((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [field]: value,
      };
    });
  }

  async function handleSave() {
    if (!settings) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const updated = await updatePlatformSettings(settings);
      setSettings(updated);
      setSaveSuccess('Platform settings saved successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected error while saving platform settings.';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout
      title="Platform Settings"
      subtitle="Control global integrations, webhook behavior, and latency fallback policies."
      headerAction={
        <Button variant="contained" startIcon={<SaveRoundedIcon />} onClick={handleSave} disabled={loading || saving || !settings}>
          Save Changes
        </Button>
      }
    >
      {loading ? (
        <Stack alignItems="center" justifyContent="center" py={4}>
          <CircularProgress size={28} />
        </Stack>
      ) : null}

      {loadError ? (
        <Alert
          severity="error"
          sx={{ mb: 2.2 }}
          action={
            <Button color="inherit" size="small" onClick={() => setReloadToken((current) => current + 1)}>
              Retry
            </Button>
          }
        >
          {loadError}
        </Alert>
      ) : null}

      {saveSuccess ? (
        <Alert severity="success" sx={{ mb: 2.2 }}>
          {saveSuccess}
        </Alert>
      ) : null}

      {saveError ? (
        <Alert severity="error" sx={{ mb: 2.2 }}>
          {saveError}
        </Alert>
      ) : null}

      <Grid2 container spacing={2.2}>
        <Grid2 size={{ xs: 12, lg: 7 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="overline" color="text.secondary">
                  Integration Keys
                </Typography>
                <TextField
                  label="OpenAI API Key"
                  value={settings?.openaiApiKey ?? ''}
                  onChange={(event) => updateField('openaiApiKey', event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Deepgram API Key"
                  value={settings?.deepgramApiKey ?? ''}
                  onChange={(event) => updateField('deepgramApiKey', event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Twilio Account SID"
                  value={settings?.twilioAccountSid ?? ''}
                  onChange={(event) => updateField('twilioAccountSid', event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Rime API Key"
                  value={settings?.rimeApiKey ?? ''}
                  onChange={(event) => updateField('rimeApiKey', event.target.value)}
                  fullWidth
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid2>

        <Grid2 size={{ xs: 12, lg: 5 }}>
          <Stack spacing={2.2}>
            <Card elevation={2}>
              <CardContent>
                <Stack spacing={1.5}>
                <Typography variant="overline" color="text.secondary">
                  Service Status
                </Typography>

                  {integrationRows.map((item) => (
                    <StatusRow key={item.label} label={item.label} tone={item.tone} />
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1.2}>
                  <Typography variant="overline" color="text.secondary">
                    Runtime Behavior
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings?.enableBargeInInterruption ?? false}
                        onChange={(_, checked) => updateField('enableBargeInInterruption', checked)}
                      />
                    }
                    label="Enable barge-in interruption"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings?.playLatencyFillerPhraseOnTimeout ?? false}
                        onChange={(_, checked) => updateField('playLatencyFillerPhraseOnTimeout', checked)}
                      />
                    }
                    label="Play latency filler phrase on timeout"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings?.allowAutoRetryOnFailedCalls ?? false}
                        onChange={(_, checked) => updateField('allowAutoRetryOnFailedCalls', checked)}
                      />
                    }
                    label="Allow auto-retry on failed calls"
                  />
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid2>
      </Grid2>
    </AppLayout>
  );
}

interface StatusRowProps {
  label: string;
  tone: 'active' | 'busy' | 'error';
}

function StatusRow({ label, tone }: StatusRowProps) {
  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body2">{label}</Typography>
        <StatusChip label={tone === 'active' ? 'connected' : tone === 'busy' ? 'degraded' : 'offline'} tone={tone} />
      </Stack>
      <Divider />
    </>
  );
}

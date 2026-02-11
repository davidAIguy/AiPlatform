import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
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
import { getPlatformSettings, listPlatformSettingsHistory, updatePlatformSettings } from '../lib/api';
import { PlatformSettings, PlatformSettingsAuditEntry } from '../types/domain';

const OPENAI_KEY_PATTERN = /^sk-[A-Za-z0-9*._-]{10,}$/;
const DEEPGRAM_KEY_PATTERN = /^dg-[A-Za-z0-9*._-]{8,}$/;
const TWILIO_SID_PATTERN = /^AC[A-Za-z0-9*]{10,}$/;
const RIME_KEY_PATTERN = /^rm-[A-Za-z0-9*._-]{8,}$/;
const HISTORY_LIMIT = 8;
const DEFAULT_AUDIT_ACTOR = 'platform-admin';

interface SettingsValidationErrors {
  openaiApiKey: string | null;
  deepgramApiKey: string | null;
  twilioAccountSid: string | null;
  rimeApiKey: string | null;
}

function validateSettingsKeys(settings: PlatformSettings | null): SettingsValidationErrors {
  if (!settings) {
    return {
      openaiApiKey: null,
      deepgramApiKey: null,
      twilioAccountSid: null,
      rimeApiKey: null,
    };
  }

  return {
    openaiApiKey: OPENAI_KEY_PATTERN.test(settings.openaiApiKey)
      ? null
      : "Must start with 'sk-' and include at least 10 more characters.",
    deepgramApiKey: DEEPGRAM_KEY_PATTERN.test(settings.deepgramApiKey)
      ? null
      : "Must start with 'dg-' and include at least 8 more characters.",
    twilioAccountSid: TWILIO_SID_PATTERN.test(settings.twilioAccountSid)
      ? null
      : "Must start with 'AC' and include at least 10 more characters.",
    rimeApiKey: RIME_KEY_PATTERN.test(settings.rimeApiKey)
      ? null
      : "Must start with 'rm-' and include at least 8 more characters.",
  };
}

export function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [history, setHistory] = useState<PlatformSettingsAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [auditActor, setAuditActor] = useState(DEFAULT_AUDIT_ACTOR);
  const [changeReason, setChangeReason] = useState('');

  const validationErrors = useMemo(() => validateSettingsKeys(settings), [settings]);
  const hasValidationErrors = useMemo(
    () => Object.values(validationErrors).some((value) => value !== null),
    [validationErrors],
  );

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      setLoading(true);

      try {
        const [nextSettings, nextHistory] = await Promise.all([
          getPlatformSettings(),
          listPlatformSettingsHistory(HISTORY_LIMIT),
        ]);

        if (!active) {
          return;
        }

        setSettings(nextSettings);
        setHistory(nextHistory);
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
      { label: 'OpenAI', tone: validationErrors.openaiApiKey ? 'error' : 'active' },
      { label: 'Deepgram', tone: validationErrors.deepgramApiKey ? 'error' : 'active' },
      { label: 'Twilio', tone: validationErrors.twilioAccountSid ? 'error' : 'active' },
      { label: 'Rime', tone: validationErrors.rimeApiKey ? 'error' : 'active' },
    ] as const;
  }, [settings, validationErrors]);

  const fieldLabels: Record<string, string> = {
    openaiApiKey: 'OpenAI Key',
    deepgramApiKey: 'Deepgram Key',
    twilioAccountSid: 'Twilio SID',
    rimeApiKey: 'Rime Key',
    enableBargeInInterruption: 'Barge-in',
    playLatencyFillerPhraseOnTimeout: 'Latency Filler',
    allowAutoRetryOnFailedCalls: 'Auto Retry',
  };

  function formatHistoryDate(value: string): string {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    return parsed.toLocaleString();
  }

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

    if (hasValidationErrors) {
      setSaveSuccess(null);
      setSaveError('Please fix invalid key formats before saving.');
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const updated = await updatePlatformSettings({
        ...settings,
        auditActor: auditActor.trim() || DEFAULT_AUDIT_ACTOR,
        changeReason: changeReason.trim() || undefined,
      });
      const updatedHistory = await listPlatformSettingsHistory(HISTORY_LIMIT);
      setSettings(updated);
      setHistory(updatedHistory);
      setSaveSuccess('Platform settings saved successfully.');
      setChangeReason('');
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
        <Button
          variant="contained"
          startIcon={<SaveRoundedIcon />}
          onClick={handleSave}
          disabled={loading || saving || !settings || hasValidationErrors}
        >
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

      {hasValidationErrors ? (
        <Alert severity="warning" sx={{ mb: 2.2 }}>
          Some credentials do not match expected formats. Please review highlighted fields.
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
                  error={Boolean(validationErrors.openaiApiKey)}
                  helperText={validationErrors.openaiApiKey ?? 'Expected: sk-...'}
                  fullWidth
                />
                <TextField
                  label="Deepgram API Key"
                  value={settings?.deepgramApiKey ?? ''}
                  onChange={(event) => updateField('deepgramApiKey', event.target.value)}
                  error={Boolean(validationErrors.deepgramApiKey)}
                  helperText={validationErrors.deepgramApiKey ?? 'Expected: dg-...'}
                  fullWidth
                />
                <TextField
                  label="Twilio Account SID"
                  value={settings?.twilioAccountSid ?? ''}
                  onChange={(event) => updateField('twilioAccountSid', event.target.value)}
                  error={Boolean(validationErrors.twilioAccountSid)}
                  helperText={validationErrors.twilioAccountSid ?? 'Expected: AC...'}
                  fullWidth
                />
                <TextField
                  label="Rime API Key"
                  value={settings?.rimeApiKey ?? ''}
                  onChange={(event) => updateField('rimeApiKey', event.target.value)}
                  error={Boolean(validationErrors.rimeApiKey)}
                  helperText={validationErrors.rimeApiKey ?? 'Expected: rm-...'}
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

                  <Divider />

                  <TextField
                    label="Audit Actor"
                    value={auditActor}
                    onChange={(event) => setAuditActor(event.target.value)}
                    helperText="Recorded in settings history"
                    fullWidth
                  />

                  <TextField
                    label="Change Reason (optional)"
                    value={changeReason}
                    onChange={(event) => setChangeReason(event.target.value)}
                    placeholder="Describe why this update is needed"
                    multiline
                    minRows={2}
                    fullWidth
                  />
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1.4}>
                  <Typography variant="overline" color="text.secondary">
                    Settings History
                  </Typography>

                  {history.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No settings updates recorded yet.
                    </Typography>
                  ) : null}

                  {history.map((entry) => (
                    <Stack key={entry.id} spacing={0.8}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                        <Typography variant="caption" color="text.secondary">
                          {formatHistoryDate(entry.changedAt)}
                        </Typography>
                        <Chip size="small" label={entry.actor} variant="outlined" />
                      </Stack>

                      {entry.reason ? (
                        <Typography variant="caption" color="text.secondary">
                          {entry.reason}
                        </Typography>
                      ) : null}

                      <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                        {entry.changedFields.map((field) => (
                          <Chip key={`${entry.id}-${field}`} size="small" label={fieldLabels[field] ?? field} />
                        ))}
                      </Stack>

                      <Divider />
                    </Stack>
                  ))}
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

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
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '../components/layout/AppLayout';
import { StatusChip } from '../components/common/StatusChip';
import { getUserRole } from '../lib/auth';
import {
  getPlatformSettings,
  getPlatformSettingsHistoryMeta,
  listPlatformSettingsHistory,
  updatePlatformSettings,
} from '../lib/api';
import {
  PlatformSettings,
  PlatformSettingsAuditEntry,
  PlatformSettingsHistoryMeta,
} from '../types/domain';

const OPENAI_KEY_PATTERN = /^sk-[A-Za-z0-9*._-]{10,}$/;
const DEEPGRAM_KEY_PATTERN = /^dg-[A-Za-z0-9*._-]{8,}$/;
const TWILIO_SID_PATTERN = /^AC[A-Za-z0-9*]{10,}$/;
const RIME_KEY_PATTERN = /^rm-[A-Za-z0-9*._-]{8,}$/;
const HISTORY_LIMIT = 8;
const HISTORY_FETCH_LIMIT = HISTORY_LIMIT + 1;
const DEFAULT_AUDIT_ACTOR = 'platform-admin';
const FIELD_LABELS: Record<string, string> = {
  openaiApiKey: 'OpenAI Key',
  deepgramApiKey: 'Deepgram Key',
  twilioAccountSid: 'Twilio SID',
  rimeApiKey: 'Rime Key',
  enableBargeInInterruption: 'Barge-in',
  playLatencyFillerPhraseOnTimeout: 'Latency Filler',
  allowAutoRetryOnFailedCalls: 'Auto Retry',
};

function toRangeStart(value: string): string {
  return `${value}T00:00:00Z`;
}

function toRangeEnd(value: string): string {
  return `${value}T23:59:59.999Z`;
}

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
  const canEditSettings = getUserRole() !== 'viewer';
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [history, setHistory] = useState<PlatformSettingsAuditEntry[]>([]);
  const [historyMeta, setHistoryMeta] = useState<PlatformSettingsHistoryMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [auditActor, setAuditActor] = useState(DEFAULT_AUDIT_ACTOR);
  const [changeReason, setChangeReason] = useState('');
  const [historyActorFilter, setHistoryActorFilter] = useState('all');
  const [historyFieldFilter, setHistoryFieldFilter] = useState('all');
  const [historyFromDate, setHistoryFromDate] = useState('');
  const [historyToDate, setHistoryToDate] = useState('');
  const [historyPage, setHistoryPage] = useState(0);
  const [historyHasNextPage, setHistoryHasNextPage] = useState(false);

  const validationErrors = useMemo(() => validateSettingsKeys(settings), [settings]);
  const hasValidationErrors = useMemo(
    () => Object.values(validationErrors).some((value) => value !== null),
    [validationErrors],
  );

  const invalidHistoryDateRange = useMemo(
    () => historyFromDate.length > 0 && historyToDate.length > 0 && historyFromDate > historyToDate,
    [historyFromDate, historyToDate],
  );

  const actorOptions = useMemo(() => {
    const availableActors = historyMeta?.actors ?? [];

    if (historyActorFilter !== 'all' && !availableActors.includes(historyActorFilter)) {
      return [historyActorFilter, ...availableActors];
    }

    return availableActors;
  }, [historyMeta, historyActorFilter]);

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

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      if (invalidHistoryDateRange) {
        setHistory([]);
        setHistoryMeta(null);
        setHistoryHasNextPage(false);
        setHistoryError('From date must be before or equal to To date.');
        setHistoryLoading(false);
        return;
      }

      setHistoryLoading(true);
      setHistoryError(null);

      try {
        const fromDate = historyFromDate ? toRangeStart(historyFromDate) : undefined;
        const toDate = historyToDate ? toRangeEnd(historyToDate) : undefined;

        const [nextHistory, nextHistoryMeta] = await Promise.all([
          listPlatformSettingsHistory({
            limit: HISTORY_FETCH_LIMIT,
            offset: historyPage * HISTORY_LIMIT,
            actor: historyActorFilter === 'all' ? undefined : historyActorFilter,
            changedField: historyFieldFilter === 'all' ? undefined : historyFieldFilter,
            fromDate,
            toDate,
          }),
          getPlatformSettingsHistoryMeta({
            fromDate,
            toDate,
          }),
        ]);

        if (!active) {
          return;
        }

        setHistory(nextHistory.slice(0, HISTORY_LIMIT));
        setHistoryMeta(nextHistoryMeta);
        setHistoryHasNextPage(nextHistory.length > HISTORY_LIMIT);
      } catch (error) {
        if (!active) {
          return;
        }

        const message = error instanceof Error ? error.message : 'Unexpected error while loading settings history.';
        setHistoryError(message);
        setHistory([]);
        setHistoryMeta(null);
        setHistoryHasNextPage(false);
      } finally {
        if (active) {
          setHistoryLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      active = false;
    };
  }, [reloadToken, historyActorFilter, historyFieldFilter, historyFromDate, historyToDate, invalidHistoryDateRange, historyPage]);

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

  const historyFieldOptions = useMemo(() => {
    const fallbackFields = Object.keys(FIELD_LABELS);
    const availableFields = historyMeta?.changedFields.length ? historyMeta.changedFields : fallbackFields;

    if (historyFieldFilter !== 'all' && !availableFields.includes(historyFieldFilter)) {
      return [historyFieldFilter, ...availableFields];
    }

    return availableFields;
  }, [historyMeta, historyFieldFilter]);

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

    if (!canEditSettings) {
      setSaveSuccess(null);
      setSaveError('Your role is read-only for platform settings.');
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
      const fromDate = invalidHistoryDateRange || !historyFromDate ? undefined : toRangeStart(historyFromDate);
      const toDate = invalidHistoryDateRange || !historyToDate ? undefined : toRangeEnd(historyToDate);
      const [updatedHistory, updatedHistoryMeta] = await Promise.all([
        listPlatformSettingsHistory({
          limit: HISTORY_FETCH_LIMIT,
          offset: 0,
          actor: historyActorFilter === 'all' ? undefined : historyActorFilter,
          changedField: historyFieldFilter === 'all' ? undefined : historyFieldFilter,
          fromDate,
          toDate,
        }),
        getPlatformSettingsHistoryMeta({
          fromDate,
          toDate,
        }),
      ]);
      setSettings(updated);
      setHistory(updatedHistory.slice(0, HISTORY_LIMIT));
      setHistoryMeta(updatedHistoryMeta);
      setHistoryHasNextPage(updatedHistory.length > HISTORY_LIMIT);
      setHistoryPage(0);
      setHistoryError(null);
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
          disabled={loading || saving || !settings || hasValidationErrors || !canEditSettings}
        >
          Save Changes
        </Button>
      }
    >
      {!canEditSettings ? (
        <Alert severity="info" sx={{ mb: 2.2 }}>
          You are signed in as viewer. Settings are read-only.
        </Alert>
      ) : null}

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

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.1}>
                    <TextField
                      select
                      size="small"
                      label="Actor"
                      value={historyActorFilter}
                      onChange={(event) => {
                        setHistoryActorFilter(event.target.value);
                        setHistoryPage(0);
                      }}
                      sx={{ minWidth: 170 }}
                    >
                      <MenuItem value="all">All Actors</MenuItem>
                      {actorOptions.map((actor) => (
                        <MenuItem key={actor} value={actor}>
                          {actor}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      select
                      size="small"
                      label="Field"
                      value={historyFieldFilter}
                      onChange={(event) => {
                        setHistoryFieldFilter(event.target.value);
                        setHistoryPage(0);
                      }}
                      sx={{ minWidth: 190 }}
                    >
                      <MenuItem value="all">All Fields</MenuItem>
                      {historyFieldOptions.map((field) => (
                        <MenuItem key={field} value={field}>
                          {FIELD_LABELS[field] ?? field}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      size="small"
                      type="date"
                      label="From"
                      value={historyFromDate}
                      onChange={(event) => {
                        setHistoryFromDate(event.target.value);
                        setHistoryPage(0);
                      }}
                      InputLabelProps={{ shrink: true }}
                    />

                    <TextField
                      size="small"
                      type="date"
                      label="To"
                      value={historyToDate}
                      onChange={(event) => {
                        setHistoryToDate(event.target.value);
                        setHistoryPage(0);
                      }}
                      InputLabelProps={{ shrink: true }}
                    />

                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setHistoryActorFilter('all');
                        setHistoryFieldFilter('all');
                        setHistoryFromDate('');
                        setHistoryToDate('');
                        setHistoryPage(0);
                      }}
                    >
                      Clear
                    </Button>
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      Page {historyPage + 1}
                      {historyMeta ? ` • ${historyMeta.totalEntries} matching` : ''}
                    </Typography>

                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={historyPage === 0 || historyLoading}
                        onClick={() => setHistoryPage((current) => Math.max(current - 1, 0))}
                      >
                        Previous
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        disabled={!historyHasNextPage || historyLoading || invalidHistoryDateRange}
                        onClick={() => setHistoryPage((current) => current + 1)}
                      >
                        Next
                      </Button>
                    </Stack>
                  </Stack>

                  {historyLoading ? (
                    <Typography variant="body2" color="text.secondary">
                      Loading history...
                    </Typography>
                  ) : null}

                  {historyError ? (
                    <Alert severity="warning" sx={{ py: 0.5 }}>
                      {historyError}
                    </Alert>
                  ) : null}

                  {history.length === 0 && !historyLoading && !historyError ? (
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
                          <Chip key={`${entry.id}-${field}`} size="small" label={FIELD_LABELS[field] ?? field} />
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

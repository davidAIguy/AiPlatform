import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  FormControl,
  Grid2,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { listAgents, listOrganizations } from '../../lib/api';
import { Agent, Organization } from '../../types/domain';

interface AgentEditorDialogProps {
  open: boolean;
  selectedAgentId?: string;
  onClose: () => void;
}

const voices = ['rime-serena', 'rime-orion', 'rime-rhea', 'rime-milo'];
const fallbackVoice = voices[0] ?? 'rime-serena';

const defaultSystemPrompt =
  'You are a polite and concise phone receptionist. Always confirm customer intent, collect appointment context, and summarize next actions clearly.';

export function AgentEditorDialog({ open, selectedAgentId, onClose }: AgentEditorDialogProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!open) {
      return undefined;
    }

    async function loadData() {
      setLoading(true);

      try {
        const [nextAgents, nextOrganizations] = await Promise.all([listAgents(), listOrganizations()]);

        if (!active) {
          return;
        }

        setAgents(nextAgents);
        setOrganizations(nextOrganizations);
        setError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }

        const message = loadError instanceof Error ? loadError.message : 'Unexpected error while loading agent metadata.';
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
  }, [open]);

  const fallbackOrganizationName = organizations[0]?.name ?? '';

  const initialValues = useMemo(() => {
    const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);

    return {
      name: selectedAgent?.name ?? '',
      organizationName: selectedAgent?.organizationName ?? fallbackOrganizationName,
      model: selectedAgent?.model ?? 'gpt-4.1-mini',
      voiceId: selectedAgent?.voiceId ?? fallbackVoice,
      twilioNumber: selectedAgent?.twilioNumber ?? '',
      systemPrompt: defaultSystemPrompt,
      deepgramModel: 'nova-3',
    };
  }, [agents, fallbackOrganizationName, selectedAgentId]);

  const [formValues, setFormValues] = useState(initialValues);

  useEffect(() => {
    setFormValues(initialValues);
  }, [initialValues]);

  const handleChange = (field: keyof typeof formValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} fullScreen onClose={onClose}>
      <AppBar position="sticky" color="inherit" elevation={1}>
        <Toolbar sx={{ gap: 1, justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <IconButton onClick={onClose} aria-label="close">
              <CloseRoundedIcon />
            </IconButton>
            <Typography variant="h6">Agent Configuration</Typography>
          </Stack>

          <Button variant="contained" startIcon={<SaveRoundedIcon />}>
            Save Agent
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: { xs: 2, sm: 3, md: 5 }, maxWidth: 1200, width: '100%', mx: 'auto' }}>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" py={2}>
            <CircularProgress size={24} />
          </Stack>
        ) : null}

        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}

        <Grid2 container spacing={2.5}>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Agent Name"
              value={formValues.name}
              onChange={(event) => handleChange('name', event.target.value)}
            />
          </Grid2>

          <Grid2 size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <Select
                value={formValues.organizationName}
                onChange={(event) => handleChange('organizationName', event.target.value)}
                displayEmpty
                inputProps={{ 'aria-label': 'organization' }}
              >
                {organizations.length === 0 ? (
                  <MenuItem disabled value="">
                    No organizations
                  </MenuItem>
                ) : null}
                {organizations.map((organization) => (
                  <MenuItem key={organization.id} value={organization.name}>
                    {organization.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid2>

          <Grid2 size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <Select
                value={formValues.model}
                onChange={(event) => handleChange('model', event.target.value)}
                displayEmpty
                inputProps={{ 'aria-label': 'model' }}
              >
                <MenuItem value="gpt-4.1-mini">gpt-4.1-mini</MenuItem>
                <MenuItem value="gpt-4.1">gpt-4.1</MenuItem>
                <MenuItem value="gpt-4o-mini">gpt-4o-mini</MenuItem>
              </Select>
            </FormControl>
          </Grid2>

          <Grid2 size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <Select
                value={formValues.voiceId}
                onChange={(event) => handleChange('voiceId', event.target.value)}
                displayEmpty
                inputProps={{ 'aria-label': 'voice profile' }}
              >
                {voices.map((voice) => (
                  <MenuItem key={voice} value={voice}>
                    {voice}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid2>

          <Grid2 size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Twilio Number"
              value={formValues.twilioNumber}
              onChange={(event) => handleChange('twilioNumber', event.target.value)}
            />
          </Grid2>

          <Grid2 size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              minRows={14}
              label="System Prompt"
              value={formValues.systemPrompt}
              onChange={(event) => handleChange('systemPrompt', event.target.value)}
              helperText="OpenAI prompt block used for call orchestration behavior"
            />
          </Grid2>

          <Grid2 size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Deepgram STT Model"
              value={formValues.deepgramModel}
              onChange={(event) => handleChange('deepgramModel', event.target.value)}
            />
          </Grid2>
        </Grid2>
      </Box>
    </Dialog>
  );
}

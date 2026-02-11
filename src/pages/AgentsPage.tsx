import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import GraphicEqRoundedIcon from '@mui/icons-material/GraphicEqRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import PhoneInTalkRoundedIcon from '@mui/icons-material/PhoneInTalkRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import SettingsSuggestRoundedIcon from '@mui/icons-material/SettingsSuggestRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import WorkOutlineRoundedIcon from '@mui/icons-material/WorkOutlineRounded';
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid2,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';
import { useMediaQuery, useTheme } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { createAgent, deleteAgent, listAgents, updateAgent } from '../lib/api';
import { StatusChip } from '../components/common/StatusChip';
import { Agent } from '../types/domain';

const orgOptions = ['Dental Clinic X', 'Prime Auto Group', 'Harbor Legal Services'];
const modelOptions = [
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini (OpenAI)' },
  { value: 'gpt-4.1', label: 'GPT-4.1 (OpenAI)' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (OpenAI)' },
];
const voiceOptions = [
  { value: 'rime-serena', label: 'Serena (Calm, Female)' },
  { value: 'rime-orion', label: 'Orion (Conversational, Male)' },
  { value: 'rime-rhea', label: 'Rhea (Friendly, Female)' },
  { value: 'rime-milo', label: 'Milo (Natural, Male)' },
];
const NEW_AGENT_ID = '__new__';

const initialPrompt = `# IDENTITY
You are "NexusBot", a tier-1 customer support agent for VoiceNexus AI. Your tone is professional, empathetic, and concise.

# CORE OBJECTIVES
1. Authenticate the user by asking for their account identifier.
2. Troubleshoot voice agent connectivity issues.
3. Escalate to a human if sentiment trends negative.

# KNOWLEDGE BASE
- Basic plan is $29/mo, Pro plan is $99/mo.
- Current uptime this month is 99.99%.

# GUARDRAILS
- Never ask for payment details.
- If uncertain, acknowledge and offer ticket escalation.
- Keep responses short and interruption-friendly.

# CONVERSATION FLOW
[Start] -> "Hello, thank you for calling VoiceNexus. How can I help you today?"`;

export function AgentsPage() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(NEW_AGENT_ID);

  const [agentName, setAgentName] = useState('Customer Support Bot v1');
  const [orgName, setOrgName] = useState(orgOptions[0] ?? '');
  const [model, setModel] = useState(modelOptions[0]?.value ?? '');
  const [voice, setVoice] = useState(voiceOptions[0]?.value ?? '');
  const [twilioNumber, setTwilioNumber] = useState('+1 (555) 012-3456');
  const [status, setStatus] = useState<Agent['status']>('active');
  const [promptVersion, setPromptVersion] = useState('v1.0');
  const [averageLatencyMs, setAverageLatencyMs] = useState(0);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingAgentId, setDeletingAgentId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const promptTokens = useMemo(() => Math.round(prompt.length / 6), [prompt]);
  const isMutating = isSaving || deletingAgentId !== null;

  function formatStatusLabel(value: Agent['status']): string {
    if (value === 'active') {
      return 'Active';
    }

    if (value === 'offline') {
      return 'Offline';
    }

    return 'Error';
  }

  function resetFormToDefaults() {
    setAgentName('Customer Support Bot v1');
    setOrgName(orgOptions[0] ?? '');
    setModel(modelOptions[0]?.value ?? '');
    setVoice(voiceOptions[0]?.value ?? '');
    setTwilioNumber('+1 (555) 012-3456');
    setStatus('active');
    setPromptVersion('v1.0');
    setAverageLatencyMs(0);
    setPrompt(initialPrompt);
  }

  function loadAgentIntoForm(agent: Agent) {
    setAgentName(agent.name);
    setOrgName(agent.organizationName);
    setModel(agent.model);
    setVoice(agent.voiceId);
    setTwilioNumber(agent.twilioNumber);
    setStatus(agent.status);
    setPromptVersion(agent.promptVersion);
    setAverageLatencyMs(agent.averageLatencyMs);
    setPrompt(agent.prompt || initialPrompt);
  }

  function handleSelectAgent(nextId: string) {
    setSaveError(null);
    setSaveSuccess(null);

    if (nextId === NEW_AGENT_ID) {
      setSelectedAgentId(NEW_AGENT_ID);
      resetFormToDefaults();
      return;
    }

    const selectedAgent = agents.find((agent) => agent.id === nextId);

    if (!selectedAgent) {
      return;
    }

    setSelectedAgentId(selectedAgent.id);
    loadAgentIntoForm(selectedAgent);
  }

  useEffect(() => {
    let active = true;

    async function loadExistingAgents() {
      setLoadingAgents(true);

      try {
        const nextAgents = await listAgents();

        if (!active) {
          return;
        }

        setAgents(nextAgents);
        setLoadError(null);

        if (nextAgents.length > 0) {
          const firstAgent = nextAgents[0];

          if (firstAgent) {
            setSelectedAgentId(firstAgent.id);
            loadAgentIntoForm(firstAgent);
          }
        } else {
          setSelectedAgentId(NEW_AGENT_ID);
          resetFormToDefaults();
        }
      } catch (loadAgentsError) {
        if (!active) {
          return;
        }

        const message = loadAgentsError instanceof Error ? loadAgentsError.message : 'Unexpected error while loading agents.';
        setLoadError(message);
      } finally {
        if (active) {
          setLoadingAgents(false);
        }
      }
    }

    loadExistingAgents();

    return () => {
      active = false;
    };
  }, [reloadToken]);

  async function handleSaveAgent() {
    if (!agentName.trim()) {
      setSaveError('Agent name is required.');
      setSaveSuccess(null);
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      if (selectedAgentId === NEW_AGENT_ID) {
        const createdAgent = await createAgent({
          name: agentName.trim(),
          organizationName: orgName,
          model,
          voiceId: voice,
          twilioNumber,
          status,
          prompt,
          promptVersion,
          averageLatencyMs,
        });

        setAgents((currentAgents) => [...currentAgents, createdAgent]);
        setSelectedAgentId(createdAgent.id);
        loadAgentIntoForm(createdAgent);
        setSaveSuccess(`Created ${createdAgent.name} as ${createdAgent.id}.`);
      } else {
        const updatedAgent = await updateAgent(selectedAgentId, {
          name: agentName.trim(),
          organizationName: orgName,
          model,
          voiceId: voice,
          twilioNumber,
          status,
          prompt,
          promptVersion,
          averageLatencyMs,
        });

        setAgents((currentAgents) =>
          currentAgents.map((agent) => {
            if (agent.id !== updatedAgent.id) {
              return agent;
            }

            return updatedAgent;
          }),
        );
        setSelectedAgentId(updatedAgent.id);
        loadAgentIntoForm(updatedAgent);
        setSaveSuccess(`Updated ${updatedAgent.name} (${updatedAgent.id}).`);
      }
    } catch (saveAgentError) {
      const message = saveAgentError instanceof Error ? saveAgentError.message : 'Unexpected error while saving the agent.';
      setSaveError(message);
      setSaveSuccess(null);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAgent(agentId: string) {
    if (isMutating) {
      return;
    }

    const targetAgent = agents.find((agent) => agent.id === agentId);

    if (!targetAgent) {
      return;
    }

    const confirmed = window.confirm(`Delete agent "${targetAgent.name}"? This action cannot be undone.`);

    if (!confirmed) {
      return;
    }

    setDeletingAgentId(agentId);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const deletedAgent = await deleteAgent(agentId);
      const nextAgents = agents.filter((agent) => agent.id !== agentId);
      setAgents(nextAgents);

      if (selectedAgentId === agentId) {
        const nextSelected = nextAgents[0];

        if (nextSelected) {
          setSelectedAgentId(nextSelected.id);
          loadAgentIntoForm(nextSelected);
        } else {
          setSelectedAgentId(NEW_AGENT_ID);
          resetFormToDefaults();
        }
      }

      setSaveSuccess(`Deleted ${deletedAgent.name} (${deletedAgent.id}).`);
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Unexpected error while deleting the agent.';
      setSaveError(message);
      setSaveSuccess(null);
    } finally {
      setDeletingAgentId(null);
    }
  }

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Toolbar sx={{ minHeight: '68px !important', justifyContent: 'space-between', px: { xs: 2, md: 4 } }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <GraphicEqRoundedIcon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  VoiceNexusAI
                </Typography>
              </Stack>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
              <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
                Agents /
                {' '}
                <Box component="span" color="primary.main">
                  New Configuration
                </Box>
              </Typography>
            </Stack>

          <Stack direction="row" spacing={0.4} alignItems="center">
            <IconButton>
              <HelpOutlineRoundedIcon />
            </IconButton>
            <IconButton>
              <NotificationsNoneRoundedIcon />
            </IconButton>
            <Avatar sx={{ width: 34, height: 34, fontWeight: 700, fontSize: '0.8rem' }}>AD</Avatar>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box sx={{ px: { xs: 1.5, md: 4 }, py: { xs: 2.5, md: 4 }, maxWidth: 1460, mx: 'auto' }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
          mb={3}
        >
          <Stack spacing={0.5}>
            <Typography variant="h2">Configure Voice Agent</Typography>
            <Typography variant="body2" color="text.secondary">
              Define your agent&apos;s identity, technical stack, and core logic.
            </Typography>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} width={{ xs: '100%', sm: 'auto' }}>
            <TextField
              select
              size="small"
              label="Editing"
              value={selectedAgentId}
              onChange={(event) => handleSelectAgent(event.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 300 } }}
              disabled={loadingAgents || isMutating}
            >
              <MenuItem value={NEW_AGENT_ID}>Create New Agent</MenuItem>
              {agents.map((agent) => (
                <MenuItem key={agent.id} value={agent.id}>
                  {agent.name}
                </MenuItem>
              ))}
            </TextField>

            <Button variant="outlined" startIcon={<PlayArrowRoundedIcon />} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              Test Configuration
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveRoundedIcon />}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
              onClick={handleSaveAgent}
              disabled={isMutating}
            >
              {selectedAgentId === NEW_AGENT_ID ? 'Create Agent' : 'Save Changes'}
            </Button>
          </Stack>
        </Stack>

        {loadingAgents ? (
          <Alert severity="info" sx={{ mb: 2.2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CircularProgress size={14} />
              <Typography variant="body2">Loading existing agents...</Typography>
            </Stack>
          </Alert>
        ) : null}

        {loadError ? (
          <Alert
            severity="warning"
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

        <Grid2 container spacing={{ xs: 1.6, md: 2.4 }}>
          <Grid2 size={{ xs: 12, lg: 4 }}>
            <Stack spacing={2.2}>
              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                      <Typography variant="h6">Existing Agents</Typography>
                      <Button
                        size="small"
                        variant={selectedAgentId === NEW_AGENT_ID ? 'contained' : 'outlined'}
                        onClick={() => handleSelectAgent(NEW_AGENT_ID)}
                        disabled={isMutating}
                      >
                        New
                      </Button>
                    </Stack>

                    {agents.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No saved agents yet. Create your first one.
                      </Typography>
                    ) : null}

                    <Stack spacing={1}>
                      {agents.map((agent) => {
                        const selected = selectedAgentId === agent.id;

                        return (
                          <Paper
                            key={agent.id}
                            variant="outlined"
                            sx={{
                              p: 1.2,
                              borderRadius: 2,
                              borderColor: selected ? 'primary.main' : 'divider',
                              bgcolor: selected ? 'primary.light' : 'background.paper',
                              cursor: 'pointer',
                            }}
                            onClick={() => handleSelectAgent(agent.id)}
                          >
                            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1.2}>
                              <Stack>
                                <Typography variant="body2" fontWeight={600}>
                                  {agent.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {agent.organizationName} - {agent.model}
                                </Typography>
                              </Stack>

                              <Stack direction="row" spacing={0.8}>
                                <Button size="small" onClick={() => handleSelectAgent(agent.id)} disabled={isMutating}>
                                  Edit
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  startIcon={<DeleteOutlineRoundedIcon fontSize="small" />}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDeleteAgent(agent.id);
                                  }}
                                  disabled={isMutating && deletingAgentId !== agent.id}
                                >
                                  {deletingAgentId === agent.id ? 'Deleting...' : 'Delete'}
                                </Button>
                              </Stack>
                            </Stack>

                            <Box mt={1}>
                              <StatusChip label={formatStatusLabel(agent.status)} tone={agent.status} />
                            </Box>
                          </Paper>
                        );
                      })}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <WorkOutlineRoundedIcon color="primary" fontSize="small" />
                      <Typography variant="h6">Agent Identity</Typography>
                    </Stack>

                    <TextField label="Agent Name" value={agentName} onChange={(event) => setAgentName(event.target.value)} fullWidth />
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <MemoryRoundedIcon color="primary" fontSize="small" />
                      <Typography variant="h6">Technical Stack</Typography>
                    </Stack>

                    <TextField select label="LLM Model" value={model} onChange={(event) => setModel(event.target.value)} fullWidth>
                      {modelOptions.map((item) => (
                        <MenuItem key={item.value} value={item.value}>
                          {item.label}
                        </MenuItem>
                      ))}
                    </TextField>

                    <Box sx={{ position: 'relative' }}>
                      <TextField
                        select
                        label="Voice ID"
                        value={voice}
                        onChange={(event) => setVoice(event.target.value)}
                        fullWidth
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end" sx={{ mr: 2.5 }}>
                              <VolumeUpRoundedIcon color="primary" fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                      >
                        {voiceOptions.map((item) => (
                          <MenuItem key={item.value} value={item.value}>
                            {item.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>

                    <TextField select label="Organization" value={orgName} onChange={(event) => setOrgName(event.target.value)} fullWidth>
                      {orgOptions.map((item) => (
                        <MenuItem key={item} value={item}>
                          {item}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField select label="Agent Status" value={status} onChange={(event) => setStatus(event.target.value as Agent['status'])} fullWidth>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="offline">Offline</MenuItem>
                      <MenuItem value="error">Error</MenuItem>
                    </TextField>

                    <TextField label="Prompt Version" value={promptVersion} onChange={(event) => setPromptVersion(event.target.value)} fullWidth />

                    <TextField
                      label="Avg Latency (ms)"
                      type="number"
                      value={averageLatencyMs}
                      onChange={(event) => {
                        const nextValue = Number(event.target.value);
                        setAverageLatencyMs(Number.isFinite(nextValue) ? nextValue : 0);
                      }}
                      fullWidth
                      inputProps={{ min: 0 }}
                    />
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PhoneInTalkRoundedIcon color="primary" fontSize="small" />
                        <Typography variant="h6">Telephony</Typography>
                      </Stack>

                      <Chip
                        size="small"
                        color="success"
                        variant="outlined"
                        icon={<CheckCircleRoundedIcon />}
                        label="Twilio Connected"
                      />
                    </Stack>

                    <TextField
                      label="Inbound Number"
                      value={twilioNumber}
                      onChange={(event) => setTwilioNumber(event.target.value)}
                      fullWidth
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <CheckCircleRoundedIcon color="success" fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <Paper variant="outlined" sx={{ p: 1.2, bgcolor: 'secondary.light' }}>
                      <Stack direction="row" spacing={1}>
                        <InfoRoundedIcon fontSize="small" color="primary" />
                        <Typography variant="caption">
                          Calls to this number will automatically trigger this agent configuration.
                        </Typography>
                      </Stack>
                    </Paper>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid2>

          <Grid2 size={{ xs: 12, lg: 8 }}>
            <Card
              variant="outlined"
              sx={{ borderRadius: 3, minHeight: { xs: 560, lg: 820 }, display: 'flex', flexDirection: 'column' }}
            >
              <CardContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                  px={2.5}
                  py={2}
                  borderBottom={(theme) => `1px solid ${theme.palette.divider}`}
                  bgcolor={(theme) => theme.m3.surfaceContainerLow}
                  gap={1}
                >
                  <Stack spacing={0.3}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <SettingsSuggestRoundedIcon color="primary" fontSize="small" />
                      <Typography variant="h6">System Prompt</Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      Define the persona, rules, and guardrails.
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1}>
                    <Button size="small">Load Template</Button>
                    <Button size="small" variant="outlined">
                      Optimize with AI
                    </Button>
                  </Stack>
                </Stack>

                <TextField
                  multiline
                  fullWidth
                  minRows={isDesktop ? 22 : 14}
                  maxRows={isDesktop ? 22 : 14}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 0,
                      '& fieldset': {
                        border: 'none',
                      },
                    },
                    '& textarea': {
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontSize: { xs: '0.78rem', md: '0.84rem' },
                      lineHeight: { xs: 1.62, md: 1.75 },
                    },
                  }}
                />

                <Divider />

                <Stack direction="row" justifyContent="space-between" alignItems="center" px={2.6} py={1.4}>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Markdown Supported
                    <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
                    Valid Syntax
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {prompt.length} chars / ~{promptTokens} tokens
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid2>
        </Grid2>
      </Box>
    </Box>
  );
}

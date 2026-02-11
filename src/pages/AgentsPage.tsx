import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
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
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import { useMemo, useState } from 'react';

const orgOptions = ['Dental Clinic X', 'Prime Auto Group', 'Harbor Legal Services'];
const modelOptions = ['GPT-4 Turbo (OpenAI)', 'GPT-4.1 Mini (OpenAI)', 'GPT-4.1 (OpenAI)'];
const voiceOptions = ['Rachel (American, Female)', 'Orion (Conversational, Male)', 'Serena (Calm, Female)'];

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
  const [agentName, setAgentName] = useState('Customer Support Bot v1');
  const [orgName, setOrgName] = useState(orgOptions[0] ?? '');
  const [model, setModel] = useState(modelOptions[0] ?? '');
  const [voice, setVoice] = useState(voiceOptions[0] ?? '');
  const [prompt, setPrompt] = useState(initialPrompt);

  const promptTokens = useMemo(() => Math.round(prompt.length / 6), [prompt]);

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
            <Button variant="outlined" startIcon={<PlayArrowRoundedIcon />} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              Test Configuration
            </Button>
            <Button variant="contained" startIcon={<SaveRoundedIcon />} sx={{ width: { xs: '100%', sm: 'auto' } }}>
              Save Agent
            </Button>
          </Stack>
        </Stack>

        <Grid2 container spacing={{ xs: 1.6, md: 2.4 }}>
          <Grid2 size={{ xs: 12, lg: 4 }}>
            <Stack spacing={2.2}>
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
                        <MenuItem key={item} value={item}>
                          {item}
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
                          <MenuItem key={item} value={item}>
                            {item}
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
                      value="+1 (555) 012-3456"
                      fullWidth
                      InputProps={{
                        readOnly: true,
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

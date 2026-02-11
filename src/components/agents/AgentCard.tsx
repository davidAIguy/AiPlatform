import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SettingsVoiceRoundedIcon from '@mui/icons-material/SettingsVoiceRounded';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { Agent } from '../../types/domain';
import { StatusChip } from '../common/StatusChip';

interface AgentCardProps {
  agent: Agent;
  onEdit: (agentId: string) => void;
}

function getTone(status: Agent['status']) {
  if (status === 'active') {
    return 'active';
  }

  if (status === 'offline') {
    return 'offline';
  }

  return 'error';
}

export function AgentCard({ agent, onEdit }: AgentCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={1.6}>
          <Stack direction="row" justifyContent="space-between" gap={1} alignItems="center">
            <Stack spacing={0.5}>
              <Typography variant="h6">{agent.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {agent.organizationName}
              </Typography>
            </Stack>
            <StatusChip label={agent.status} tone={getTone(agent.status)} />
          </Stack>

          <Divider />

          <Stack spacing={1.1}>
            <Row label="Model" value={agent.model} />
            <Row label="Voice" value={agent.voiceId} />
            <Row label="Twilio" value={agent.twilioNumber} />
            <Row label="Prompt" value={agent.promptVersion} />
            <Row label="Avg Latency" value={`${agent.averageLatencyMs} ms`} />
          </Stack>
        </Stack>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
        <Button variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => onEdit(agent.id)}>
          Edit Agent
        </Button>
        <Button variant="text" startIcon={<SettingsVoiceRoundedIcon />}>
          Test Voice
        </Button>
      </CardActions>
    </Card>
  );
}

interface RowProps {
  label: string;
  value: string;
}

function Row({ label, value }: RowProps) {
  return (
    <Stack direction="row" justifyContent="space-between" gap={1} alignItems="center">
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={530} sx={{ textAlign: 'right' }}>
        {value}
      </Typography>
    </Stack>
  );
}

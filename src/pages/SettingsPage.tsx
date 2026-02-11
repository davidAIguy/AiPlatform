import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import {
  Button,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Grid2,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { AppLayout } from '../components/layout/AppLayout';
import { StatusChip } from '../components/common/StatusChip';

export function SettingsPage() {
  return (
    <AppLayout
      title="Platform Settings"
      subtitle="Control global integrations, webhook behavior, and latency fallback policies."
      headerAction={
        <Button variant="contained" startIcon={<SaveRoundedIcon />}>
          Save Changes
        </Button>
      }
    >
      <Grid2 container spacing={2.2}>
        <Grid2 size={{ xs: 12, lg: 7 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="overline" color="text.secondary">
                  Integration Keys
                </Typography>
                <TextField label="OpenAI API Key" value="sk-live-*********************" fullWidth />
                <TextField label="Deepgram API Key" value="dg-live-*********************" fullWidth />
                <TextField label="Twilio Account SID" value="AC*********************" fullWidth />
                <TextField label="Rime API Key" value="rm-live-*********************" fullWidth />
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

                  <StatusRow label="OpenAI" tone="active" />
                  <StatusRow label="Deepgram" tone="active" />
                  <StatusRow label="Twilio" tone="busy" />
                  <StatusRow label="Rime" tone="active" />
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Stack spacing={1.2}>
                  <Typography variant="overline" color="text.secondary">
                    Runtime Behavior
                  </Typography>

                  <FormControlLabel control={<Switch defaultChecked />} label="Enable barge-in interruption" />
                  <FormControlLabel control={<Switch defaultChecked />} label="Play latency filler phrase on timeout" />
                  <FormControlLabel control={<Switch />} label="Allow auto-retry on failed calls" />
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

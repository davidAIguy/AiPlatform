import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import {
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { CallSession } from '../../types/domain';
import { StatusChip } from '../common/StatusChip';

interface CallLogTableProps {
  rows: CallSession[];
}

function getCallTone(status: CallSession['status']) {
  if (status === 'completed') {
    return 'completed';
  }

  if (status === 'busy') {
    return 'busy';
  }

  return 'failed';
}

function getSentimentTone(sentiment: CallSession['sentiment']) {
  if (sentiment === 'positive') {
    return 'positive';
  }

  if (sentiment === 'neutral') {
    return 'neutral';
  }

  return 'negative';
}

function formatDuration(durationSeconds: number) {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function CallLogTable({ rows }: CallLogTableProps) {
  const [selectedRecordingUrl, setSelectedRecordingUrl] = useState<string>(rows[0]?.recordingUrl ?? '');

  const selectedCall = useMemo(
    () => rows.find((item) => item.recordingUrl === selectedRecordingUrl) ?? rows[0],
    [rows, selectedRecordingUrl],
  );

  return (
    <Stack spacing={2}>
      <TableContainer component={Paper} elevation={0} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Time</TableCell>
              <TableCell>Agent</TableCell>
              <TableCell>Caller</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Sentiment</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.startedAt}</TableCell>
                <TableCell>{row.agentName}</TableCell>
                <TableCell>{row.callerNumber}</TableCell>
                <TableCell>{formatDuration(row.durationSeconds)}</TableCell>
                <TableCell>
                  <StatusChip label={row.status} tone={getCallTone(row.status)} />
                </TableCell>
                <TableCell>
                  <StatusChip label={row.sentiment} tone={getSentimentTone(row.sentiment)} />
                </TableCell>
                <TableCell align="right">
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<PlayArrowRoundedIcon />}
                    onClick={() => setSelectedRecordingUrl(row.recordingUrl)}
                  >
                    Play
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedCall ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1.2}>
            <Typography variant="overline" color="text.secondary">
              Call Playback
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedCall.agentName} - {selectedCall.startedAt}
            </Typography>
            <audio controls src={selectedCall.recordingUrl} style={{ width: '100%' }} />
          </Stack>
        </Paper>
      ) : null}
    </Stack>
  );
}

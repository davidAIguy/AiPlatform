import LockRoundedIcon from '@mui/icons-material/LockRounded';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { login } from '../lib/api';
import { isAuthenticated, setAuthSession } from '../lib/auth';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('admin@voicenexus.ai');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await login({
        email: email.trim(),
        password,
      });
      setAuthSession(response.accessToken, response.role);
      const redirectPath =
        typeof location.state === 'object' &&
        location.state !== null &&
        'from' in location.state &&
        typeof location.state.from === 'string'
          ? location.state.from
          : '/dashboard';

      navigate(redirectPath, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in. Please try again.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        p: 2,
      }}
    >
      <Card variant="outlined" sx={{ width: '100%', maxWidth: 460 }}>
        <CardContent>
          <Stack component="form" spacing={2} onSubmit={handleSubmit}>
            <Stack spacing={0.6}>
              <Typography variant="h4" fontWeight={620}>
                VoiceNexus AI
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in to manage organizations, agents, and call intelligence.
              </Typography>
            </Stack>

            <Alert severity="info" variant="outlined">
              Demo credentials: admin@voicenexus.ai / admin123
            </Alert>

            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            <TextField
              label="Work Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <LockRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />

            <Button type="submit" variant="contained" size="large" disabled={submitting}>
              {submitting ? 'Signing In...' : 'Continue to Dashboard'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

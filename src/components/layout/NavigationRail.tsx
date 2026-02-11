import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AppsRoundedIcon from '@mui/icons-material/AppsRounded';
import CallRoundedIcon from '@mui/icons-material/CallRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import { Avatar, Box, IconButton, Paper, Stack, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useLocation, useNavigate } from 'react-router-dom';
import { clearAuthSession } from '../../lib/auth';

interface NavItem {
  label: string;
  path: string;
  icon: JSX.Element;
}

const navItems: NavItem[] = [
  { label: 'Dash', path: '/dashboard', icon: <AppsRoundedIcon /> },
  { label: 'Clients', path: '/clients', icon: <GroupsRoundedIcon /> },
  { label: 'Agents', path: '/agents', icon: <SupportAgentRoundedIcon /> },
  { label: 'Logs', path: '/call-logs', icon: <CallRoundedIcon /> },
];

export function NavigationRail() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  function handleLogout() {
    clearAuthSession();
    navigate('/login');
  }

  const navButtonStyles = {
    borderRadius: 6,
    width: 58,
    height: 54,
    display: 'flex',
    flexDirection: 'column',
    gap: 0.35,
    color: theme.palette.text.secondary,
    '& .MuiSvgIcon-root': {
      fontSize: 20,
    },
    '&:hover': {
      backgroundColor: theme.m3.surfaceVariant,
      color: theme.palette.text.primary,
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
    },
  } as const;

  if (isDesktop) {
    return (
      <Paper
        elevation={0}
        sx={{
          width: 88,
          minHeight: '100dvh',
          position: 'sticky',
          top: 0,
          borderRight: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.m3.surfaceContainerLow,
          px: 1.25,
          py: 1.5,
        }}
      >
        <Stack spacing={2.25} alignItems="center" sx={{ height: '100%' }}>
          <IconButton
            aria-label="open menu"
            sx={{
              width: 42,
              height: 42,
              color: theme.palette.text.secondary,
            }}
          >
            <MenuRoundedIcon />
          </IconButton>

          <IconButton
            aria-label="add"
            sx={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              boxShadow: theme.m3.elevation.level2,
              '&:hover': {
                bgcolor: theme.palette.primary.main,
                boxShadow: theme.m3.elevation.level3,
              },
            }}
          >
            <AddRoundedIcon />
          </IconButton>

          {navItems.map((item) => {
            const selected = location.pathname === item.path;

            return (
              <IconButton
                key={item.path}
                onClick={() => navigate(item.path)}
                aria-label={item.label}
                sx={{
                  ...navButtonStyles,
                  backgroundColor: selected ? theme.palette.primary.light : 'transparent',
                  color: selected ? theme.palette.primary.dark : theme.palette.text.secondary,
                }}
              >
                {item.icon}
                <Typography variant="caption" sx={{ fontSize: '0.65rem' }} fontWeight={selected ? 600 : 500}>
                  {item.label}
                </Typography>
              </IconButton>
            );
          })}

          <Box sx={{ flex: 1 }} />

          <IconButton
            aria-label="settings"
            onClick={() => navigate('/settings')}
            sx={{
              width: 42,
              height: 42,
              color: location.pathname === '/settings' ? theme.palette.primary.main : theme.palette.text.secondary,
            }}
          >
            <SettingsRoundedIcon />
          </IconButton>

          <IconButton
            aria-label="logout"
            onClick={handleLogout}
            sx={{
              width: 42,
              height: 42,
              color: theme.palette.text.secondary,
            }}
          >
            <LogoutRoundedIcon />
          </IconButton>

          <Avatar sx={{ width: 32, height: 32, fontSize: '0.78rem', fontWeight: 700 }}>AD</Avatar>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        position: 'fixed',
        bottom: 10,
        left: 10,
        right: 10,
        borderRadius: 5,
        px: 1,
        py: 0.5,
        zIndex: 30,
        overflowX: 'auto',
        backgroundColor: theme.m3.surfaceContainer,
      }}
    >
      <Stack direction="row" spacing={0.5}>
        {[...navItems, { label: 'Settings', path: '/settings', icon: <SettingsRoundedIcon /> }].map((item) => {
          const selected = location.pathname === item.path;

          return (
            <IconButton
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              sx={{
                minWidth: 72,
                borderRadius: 4,
                bgcolor: selected ? theme.palette.primary.light : 'transparent',
                color: selected ? theme.palette.primary.dark : theme.palette.text.secondary,
                flexDirection: 'column',
                px: 1,
                '&:hover': {
                  bgcolor: selected ? theme.palette.primary.light : theme.m3.surfaceVariant,
                },
              }}
            >
              {item.icon}
              <Typography variant="caption">{item.label}</Typography>
            </IconButton>
          );
        })}

        <IconButton
          aria-label="Logout"
          onClick={handleLogout}
          sx={{
            minWidth: 72,
            borderRadius: 4,
            color: theme.palette.text.secondary,
            flexDirection: 'column',
            px: 1,
          }}
        >
          <LogoutRoundedIcon />
          <Typography variant="caption">Logout</Typography>
        </IconButton>
      </Stack>
    </Paper>
  );
}

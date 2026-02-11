import { Box, Fab, useMediaQuery } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { useTheme } from '@mui/material/styles';
import { ReactNode } from 'react';
import { NavigationRail } from './NavigationRail';
import { PageHeader } from '../common/PageHeader';
import { IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material';

interface AppLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  headerAction?: ReactNode;
  onCreate?: () => void;
  topBar?: {
    breadcrumbRoot?: string;
    breadcrumbCurrent?: string;
    searchPlaceholder?: string;
  };
}

export function AppLayout({ title, subtitle, children, headerAction, onCreate, topBar }: AppLayoutProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return (
    <Box sx={{ display: 'flex', minHeight: '100dvh' }}>
      <NavigationRail />

      <Box
        component="main"
        sx={{
          flex: 1,
          px: { xs: 1.5, sm: 2.5, md: 3.5 },
          pt: { xs: 2.5, md: topBar ? 0 : 3.5 },
          pb: { xs: 12, md: 4 },
          maxWidth: '100%',
        }}
      >
        {topBar ? (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              minHeight: { xs: 56, md: 70 },
              px: { xs: 0, md: 0.5 },
              borderBottom: `1px solid ${theme.palette.divider}`,
              mb: { xs: 2, md: 3.25 },
            }}
          >
            <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
              <Typography variant="body2" sx={{ fontSize: { xs: '0.78rem', md: '0.9rem' } }}>
                {topBar.breadcrumbRoot ?? 'Home'}
              </Typography>
              <ChevronRightRoundedIcon sx={{ fontSize: { xs: 15, md: 18 } }} />
              <Typography variant="body2" color="text.primary" fontWeight={620} sx={{ fontSize: { xs: '0.78rem', md: '0.9rem' } }}>
                {topBar.breadcrumbCurrent ?? title}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ display: { xs: 'none', sm: 'flex' } }}>
              <TextField
                size="small"
                placeholder={topBar.searchPlaceholder ?? 'Search sessions...'}
                sx={{
                  width: { xs: 190, sm: 300, md: 340 },
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 999,
                    bgcolor: 'background.default',
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <IconButton aria-label="notifications" sx={{ position: 'relative' }}>
                <NotificationsNoneRoundedIcon />
                <Box
                  sx={{
                    position: 'absolute',
                    top: 9,
                    right: 10,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: 'error.main',
                    border: (theme) => `1px solid ${theme.palette.background.paper}`,
                  }}
                />
              </IconButton>
            </Stack>
          </Stack>
        ) : null}

        <PageHeader title={title} subtitle={subtitle} action={headerAction} />
        {children}
      </Box>

      {onCreate ? (
        <Fab
          color="primary"
          aria-label="create agent"
          onClick={onCreate}
          sx={{
            position: 'fixed',
            right: { xs: 20, md: 34 },
            bottom: { xs: 90, md: 34 },
            zIndex: 20,
            minWidth: isDesktop ? 64 : 56,
          }}
        >
          <AddRoundedIcon />
        </Fab>
      ) : null}
    </Box>
  );
}

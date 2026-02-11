import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import { Avatar, Card, CardContent, Stack, Typography } from '@mui/material';
import { Organization } from '../../types/domain';
import { StatusChip } from '../common/StatusChip';

interface OrganizationCardProps {
  organization: Organization;
}

function getSubscriptionTone(status: Organization['subscriptionStatus']) {
  if (status === 'active') {
    return 'active';
  }

  if (status === 'trial') {
    return 'busy';
  }

  return 'error';
}

export function OrganizationCard({ organization }: OrganizationCardProps) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={1.6}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Avatar sx={{ width: 42, height: 42 }}>
                <BusinessRoundedIcon />
              </Avatar>
              <Stack>
                <Typography variant="h6">{organization.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {organization.activeAgents} active agents
                </Typography>
              </Stack>
            </Stack>

            <StatusChip
              label={organization.subscriptionStatus.replace('_', ' ')}
              tone={getSubscriptionTone(organization.subscriptionStatus)}
            />
          </Stack>

          <Stack direction="row" spacing={2}>
            <Stack>
              <Typography variant="caption" color="text.secondary">
                Monthly Minutes
              </Typography>
              <Typography variant="body1" fontWeight={560}>
                {organization.monthlyMinutes.toLocaleString()}m
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

'use client';

import React from 'react';
import { Card, Grid, Typography, Box, Stack } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { NetworkGrowthStats } from '../../features/networking/services/networkingApi';

export const NetworkStats: React.FC<{ stats?: NetworkGrowthStats }> = ({ stats }) => {
  const defaultStats: NetworkGrowthStats = stats || {
    totalConnections: 142,
    pendingReceived: 3,
    pendingSent: 5,
    networkGrowthThisMonth: 12,
    profileViews: 380,
    searchAppearances: 1250,
  };

  return (
    <Card sx={{ p: 3, borderRadius: '24px', mb: 3, bgcolor: 'background.paper' }}>
      <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
        Your Network Overview & Growth Analytics
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6} sm={3}>
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '16px' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'primary.main', mb: 0.5 }}>
              <PeopleIcon />
              <Typography variant="caption" sx={{ fontWeight: 800 }}>Connections</Typography>
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>{defaultStats.totalConnections}</Typography>
          </Box>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '16px' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'warning.main', mb: 0.5 }}>
              <PersonAddIcon />
              <Typography variant="caption" sx={{ fontWeight: 800 }}>Pending Invites</Typography>
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>{defaultStats.pendingReceived}</Typography>
          </Box>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '16px' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'success.main', mb: 0.5 }}>
              <TrendingUpIcon />
              <Typography variant="caption" sx={{ fontWeight: 800 }}>Growth (30d)</Typography>
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>+{defaultStats.networkGrowthThisMonth}</Typography>
          </Box>
        </Grid>

        <Grid item xs={6} sm={3}>
          <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '16px' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'info.main', mb: 0.5 }}>
              <VisibilityIcon />
              <Typography variant="caption" sx={{ fontWeight: 800 }}>Profile Views</Typography>
            </Stack>
            <Typography variant="h5" sx={{ fontWeight: 900 }}>{defaultStats.profileViews}</Typography>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
};

export default NetworkStats;

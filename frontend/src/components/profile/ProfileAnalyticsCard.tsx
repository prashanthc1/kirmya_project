'use client';

import React from 'react';
import {
  Card,
  Typography,
  Grid,
  Box,
  Stack,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';

import { ProfileAnalytics } from '../../features/profile/types';
import { tokens } from '../../theme/tokens';

interface ProfileAnalyticsCardProps {
  analytics?: ProfileAnalytics;
  views?: number;
  searchAppearances?: number;
  connectionRequests?: number;
}

export const ProfileAnalyticsCard: React.FC<ProfileAnalyticsCardProps> = ({
  analytics,
  views = 0,
  searchAppearances = 0,
  connectionRequests = 0,
}) => {
  const profileViews = analytics?.profileViews ?? views;
  const searchApps = analytics?.searchAppearances ?? searchAppearances;
  const connRequests = analytics?.connectionRequests ?? connectionRequests;

  return (
    <Card
      elevation={1}
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: `${tokens.radius.lg}px`,
        mb: 3,
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2.5 }}>
        <TrendingUpOutlinedIcon color="primary" sx={{ fontSize: 24 }} />
        <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
          Profile Analytics
        </Typography>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Box
            sx={{
              p: 2,
              borderRadius: `${tokens.radius.md}px`,
              bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.03)'),
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <VisibilityOutlinedIcon color="primary" sx={{ fontSize: 24 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {profileViews}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Profile Views
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Box
            sx={{
              p: 2,
              borderRadius: `${tokens.radius.md}px`,
              bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.03)'),
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <SearchOutlinedIcon color="primary" sx={{ fontSize: 24 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {searchApps}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Search Appearances
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Box
            sx={{
              p: 2,
              borderRadius: `${tokens.radius.md}px`,
              bgcolor: (t) => (t.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.03)'),
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <PersonAddOutlinedIcon color="primary" sx={{ fontSize: 24 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {connRequests}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Connection Requests
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
};

export default ProfileAnalyticsCard;

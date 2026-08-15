'use client';

import React from 'react';
import {
  Card,
  Typography,
  Grid,
  Box,
  Stack,
  Chip,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { ProfileAnalytics } from '../../features/profile/types';

interface ProfileAnalyticsCardProps {
  analytics?: ProfileAnalytics;
  views?: number;
  searchAppearances?: number;
  connectionRequests?: number;
}

export const ProfileAnalyticsCard: React.FC<ProfileAnalyticsCardProps> = ({
  analytics,
  views = 420,
  searchAppearances = 1280,
  connectionRequests = 35,
}) => {
  const profileViews = analytics?.profileViews ?? views;
  const searchApps = analytics?.searchAppearances ?? searchAppearances;
  const connRequests = analytics?.connectionRequests ?? connectionRequests;

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: '24px',
        mb: 3,
        bgcolor: 'background.paper',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TrendingUpIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Profile Analytics & Impression Metrics
          </Typography>
        </Stack>
        <Chip
          icon={<TrendingUpIcon />}
          label="+18% this month"
          color="success"
          size="small"
          sx={{ fontWeight: 800, borderRadius: '8px' }}
        />
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: '16px',
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
              textAlign: 'center',
            }}
          >
            <VisibilityIcon color="primary" sx={{ mb: 0.5 }} />
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              {profileViews.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              Profile Views
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: '16px',
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
              textAlign: 'center',
            }}
          >
            <SearchIcon color="secondary" sx={{ mb: 0.5 }} />
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              {searchApps.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              Search Appearances
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: '16px',
              bgcolor: 'action.hover',
              border: '1px solid',
              borderColor: 'divider',
              textAlign: 'center',
            }}
          >
            <PersonAddIcon color="success" sx={{ mb: 0.5 }} />
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              {connRequests.toLocaleString()}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              Connection Requests
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
};

export default ProfileAnalyticsCard;

'use client';

import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Stack,
  Chip,
  Paper,
  Divider,
  useTheme,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FavoriteIcon from '@mui/icons-material/Favorite';
import PublicIcon from '@mui/icons-material/Public';
import GlassCard from '../landing/GlassCard';

interface CompanyOverviewProps {
  company: any;
  profile: any;
}

export const CompanyOverview: React.FC<CompanyOverviewProps> = ({ company, profile }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <GlassCard sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <InfoIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          About {company.name}
        </Typography>
      </Stack>

      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7, mb: 4, fontSize: '1.02rem' }}>
        {profile.about}
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Mission Card */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '16px',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              height: '100%',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
              <TrackChangesIcon sx={{ color: '#6366f1' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Our Mission
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {profile.mission || 'To empower individuals and organizations to reach their highest potential through world-class services and technology.'}
            </Typography>
          </Paper>
        </Grid>

        {/* Vision Card */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '16px',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              height: '100%',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
              <VisibilityIcon sx={{ color: '#ec4899' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                Our Vision
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {profile.vision || 'To become the global gold standard in innovation, sustainable operations, and candidate-centric workplace culture.'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      {/* Core Values */}
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <FavoriteIcon sx={{ color: '#ef4444', fontSize: 20 }} /> Corporate Values
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 3 }}>
        {(profile.values || ['Integrity & Trust', 'Innovation First', 'Inclusive Growth', 'Customer Obsession', 'Operational Excellence']).map((val: string) => (
          <Chip key={val} label={val} color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
        ))}
      </Stack>

      {/* Operating Countries */}
      <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PublicIcon sx={{ color: '#10b981', fontSize: 20 }} /> Global Presence &amp; Operating Countries
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {(profile.operatingCountries || ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'United States', 'United Kingdom']).map((c: string) => (
          <Chip key={c} label={c} size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700 }} />
        ))}
      </Stack>
    </GlassCard>
  );
};

export default CompanyOverview;

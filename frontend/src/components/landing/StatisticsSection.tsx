'use client';

import React from 'react';
import { Box, Container, Grid, Typography, Stack, useTheme } from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import GroupsIcon from '@mui/icons-material/Groups';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import GlassCard from './GlassCard';
import AnimatedCounter from './AnimatedCounter';

interface StatisticsSectionProps {
  stats?: {
    jobOpportunities?: string;
    verifiedCompanies?: string;
    communityMembers?: string;
    aiSessions?: string;
  };
}

export const StatisticsSection: React.FC<StatisticsSectionProps> = ({ stats }) => {
  const theme = useTheme();

  const statItems = [
    {
      icon: <WorkIcon sx={{ fontSize: 36, color: '#6366f1' }} />,
      value: stats?.jobOpportunities || '25,480+',
      label: 'Job Opportunities',
      description: 'Verified active openings across tech, management & operations.',
    },
    {
      icon: <BusinessIcon sx={{ fontSize: 36, color: '#ec4899' }} />,
      value: stats?.verifiedCompanies || '4,850+',
      label: 'Verified Companies',
      description: 'Trusted corporate employers hiring directly on Kirmya.',
    },
    {
      icon: <GroupsIcon sx={{ fontSize: 36, color: '#10b981' }} />,
      value: stats?.communityMembers || '150,000+',
      label: 'Community Members',
      description: 'Active professionals building networks and sharing referrals.',
    },
    {
      icon: <AutoAwesomeIcon sx={{ fontSize: 36, color: '#f59e0b' }} />,
      value: stats?.aiSessions || '500,000+',
      label: 'AI Career Sessions',
      description: 'Mock interview and CV optimization sessions completed.',
    },
  ];

  return (
    <Box sx={{ py: 8, position: 'relative' }}>
      <Container maxWidth="xl">
        <Grid container spacing={3}>
          {statItems.map((item, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <GlassCard sx={{ textCenter: 'center', height: '100%' }}>
                <Stack spacing={1.5} alignItems="center" sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '16px',
                      bgcolor: 'rgba(99, 102, 241, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </Box>
                  <AnimatedCounter
                    value={item.value}
                    variant="h4"
                    sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em' }}
                  />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {item.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                    {item.description}
                  </Typography>
                </Stack>
              </GlassCard>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default StatisticsSection;

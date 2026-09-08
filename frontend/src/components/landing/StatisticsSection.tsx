'use client';

import React from 'react';
import { Box, Container, Grid, Typography, Stack } from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import GroupsIcon from '@mui/icons-material/Groups';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import GlassCard from './GlassCard';
import AnimatedCounter from './AnimatedCounter';
import { PlatformStatistics } from '../../features/landing/types';

interface StatisticsSectionProps {
  /** Counted figures from the API. Absent when nothing could be counted. */
  statistics?: PlatformStatistics;
}

/**
 * The platform figures, counted from real rows.
 *
 * This section used to render `stats?.jobOpportunities || '25,480+'` and three
 * more like it, so a deployment whose API returned nothing — which is every
 * fresh one — showed four invented numbers to every visitor as fact. There is
 * no fallback now: a figure is counted or its tile is not rendered, and when
 * none can be counted the whole section is absent.
 *
 * Counting from zero looks small, and that is the point. "142 jobs live today"
 * is checkable and survives contact with a curious visitor; "25,480+" does not.
 */
export const StatisticsSection: React.FC<StatisticsSectionProps> = ({ statistics }) => {
  if (!statistics) {
    return null;
  }

  const statItems = [
    {
      icon: <WorkIcon sx={{ fontSize: 36, color: '#6366f1' }} />,
      value: statistics.open_jobs,
      label: 'Open Jobs',
      description: 'Live postings you can apply to right now.',
    },
    {
      icon: <BusinessIcon sx={{ fontSize: 36, color: '#ec4899' }} />,
      value: statistics.hiring_companies,
      label: 'Companies Hiring',
      description: 'Employers with at least one open role on Kirmya.',
    },
    {
      icon: <GroupsIcon sx={{ fontSize: 36, color: '#10b981' }} />,
      value: statistics.members,
      label: 'Members',
      description: 'Professionals with an active Kirmya account.',
    },
    {
      icon: <AssignmentTurnedInIcon sx={{ fontSize: 36, color: '#f59e0b' }} />,
      value: statistics.applications_submitted,
      label: 'Applications Sent',
      description: 'Applications candidates have submitted through Kirmya.',
    },
  ].filter((item) => typeof item.value === 'number');

  if (statItems.length === 0) {
    return null;
  }

  return (
    <Box component="section" aria-labelledby="platform-statistics-heading" sx={{ py: 8, position: 'relative' }}>
      <Container maxWidth="xl">
        <Typography
          id="platform-statistics-heading"
          variant="h2"
          sx={{ fontSize: '1.05rem', fontWeight: 600, textAlign: 'center', mb: 4, color: 'text.secondary' }}
        >
          Kirmya today
        </Typography>
        <Grid container spacing={3}>
          {statItems.map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item.label}>
              <GlassCard sx={{ height: '100%' }}>
                <Stack spacing={1.5} alignItems="center" sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'rgba(99, 102, 241, 0.1)',
                    }}
                  >
                    {item.icon}
                  </Box>
                  <AnimatedCounter value={String(item.value.toLocaleString())} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {item.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
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

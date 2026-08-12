'use client';

import React from 'react';
import { Box, Paper, Typography, Grid, Skeleton } from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import CancelIcon from '@mui/icons-material/Cancel';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { motion } from 'framer-motion';
import { stagger } from '../../theme/motion';
import { ApplicationStatsDTO } from '@/features/applications/types';

interface ApplicationStatsProps {
  stats?: ApplicationStatsDTO;
  isLoading?: boolean;
}

export const ApplicationStats: React.FC<ApplicationStatsProps> = ({ stats, isLoading }) => {
  const statItems = [
    { label: 'Total Applications', value: stats?.total_applications ?? 0, icon: <WorkIcon fontSize="large" />, color: '#0066FF' },
    { label: 'Active Applications', value: stats?.active_applications ?? 0, icon: <HourglassTopIcon fontSize="large" />, color: '#FF9900' },
    { label: 'Interviews Scheduled', value: stats?.interviews_scheduled ?? 0, icon: <EventAvailableIcon fontSize="large" />, color: '#9933FF' },
    { label: 'Offers Received', value: stats?.offers_received ?? 0, icon: <CardGiftcardIcon fontSize="large" />, color: '#00CC66' },
    { label: 'Rejected', value: stats?.rejected_applications ?? 0, icon: <CancelIcon fontSize="large" />, color: '#FF3366' },
    { label: 'Response Rate', value: `${(stats?.response_rate ?? 0).toFixed(1)}%`, icon: <TrendingUpIcon fontSize="large" />, color: '#00CCFF' },
  ];

  return (
    <Grid container spacing={2}>
      {statItems.map((item, index) => (
        <Grid item xs={12} sm={6} md={4} lg={2} key={item.label}>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={stagger(index, 0.05)}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  borderColor: item.color,
                },
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>
                  {item.label}
                </Typography>
                {isLoading ? (
                  <Skeleton width={50} height={32} />
                ) : (
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    {item.value}
                  </Typography>
                )}
              </Box>
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: 2.5,
                  background: `${item.color}15`,
                  color: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </Box>
            </Paper>
          </motion.div>
        </Grid>
      ))}
    </Grid>
  );
};

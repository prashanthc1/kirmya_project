'use client';

import React from 'react';
import { Box, Typography, Grid, Paper, Stack, useTheme } from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import SchoolIcon from '@mui/icons-material/School';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';

import GlassCard from '../landing/GlassCard';

interface BenefitsSectionProps {
  benefits: string[];
}

const benefitIconMap: { [key: string]: React.ReactNode } = {
  'Full Health Coverage': <LocalHospitalIcon sx={{ color: '#10b981' }} />,
  'Full Health Insurance': <LocalHospitalIcon sx={{ color: '#10b981' }} />,
  'Remote Work Options': <HomeWorkIcon sx={{ color: '#6366f1' }} />,
  'Remote & Hybrid Work': <HomeWorkIcon sx={{ color: '#6366f1' }} />,
  'Flexible Hours': <AccessTimeIcon sx={{ color: '#06b6d4' }} />,
  'Annual Flight Allowance': <FlightTakeoffIcon sx={{ color: '#f59e0b' }} />,
  'Learning Budget': <SchoolIcon sx={{ color: '#ec4899' }} />,
  'Annual Performance Bonus': <AttachMoneyIcon sx={{ color: '#10b981' }} />,
};

export const BenefitsSection: React.FC<BenefitsSectionProps> = ({ benefits }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <GlassCard sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <CardGiftcardIcon sx={{ color: '#ec4899', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          Employee Benefits &amp; Perks
        </Typography>
      </Stack>

      <Grid container spacing={2.5}>
        {benefits.map((b) => (
          <Grid item xs={12} sm={6} md={4} key={b}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 1.2,
                  borderRadius: '12px',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {benefitIconMap[b] || <CardGiftcardIcon sx={{ color: '#6366f1' }} />}
              </Paper>
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                {b}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </GlassCard>
  );
};

export default BenefitsSection;

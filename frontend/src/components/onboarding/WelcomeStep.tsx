'use client';

import React from 'react';
import { Box, Typography, Button, Stack, Paper, useTheme } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PeopleIcon from '@mui/icons-material/People';
import WorkIcon from '@mui/icons-material/Work';
import { motion } from 'framer-motion';
import { springs } from '../../theme/motion';
import GlassCard from '../landing/GlassCard';

interface StepProps {
  onNext: () => void;
}

export const WelcomeStep: React.FC<StepProps> = ({ onNext }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={springs.entrance}>
      <GlassCard sx={{ p: { xs: 3, md: 5 }, textAlign: 'center' }}>
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '24px',
            bgcolor: "primary.main",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
            boxShadow: "none",
          }}
        >
          <AutoAwesomeIcon sx={{ color: "text.primary", fontSize: 36 }} />
        </Box>

        <Typography variant="h3" sx={{ fontWeight: 900, mb: 1.5, color: 'text.primary', letterSpacing: '-0.02em' }}>
          Welcome to Kirmya!
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 580, mx: 'auto', mb: 4, lineHeight: 1.65, fontSize: '1.05rem' }}>
          Let&apos;s build your complete professional profile so we can recommend better jobs, recruiters, communities, and authentic employee connections.
        </Typography>

        {/* Feature Badges Grid */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mb: 5 }}>
          {[
            { icon: <WorkIcon sx={{ color: "primary.main" }} />, text: 'Targeted Job Matching' },
            { icon: <PeopleIcon sx={{ color: '#ec4899' }} />, text: 'Employee Referral Network' },
            { icon: <VerifiedUserIcon sx={{ color: '#10b981' }} />, text: '24/7 AI Resume Coach' },
          ].map((item, idx) => (
            <Paper
              key={idx}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '14px',
                bgcolor: isDark ? "background.paper" : 'rgba(241, 245, 249, 0.8)',
                border: (theme) => `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              {item.icon}
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {item.text}
              </Typography>
            </Paper>
          ))}
        </Stack>

        <Button
          variant="contained"
          size="large"
          onClick={onNext}
          endIcon={<ArrowForwardIcon />}
          sx={{
            py: 1.8,
            px: 5,
            borderRadius: '14px',
            fontSize: '1.05rem',
            fontWeight: 800,
            textTransform: 'none',
            bgcolor: "primary.main",
            boxShadow: "none",
          }}
        >
          Let&apos;s Get Started
        </Button>
      </GlassCard>
    </motion.div>
  );
};

export default WelcomeStep;

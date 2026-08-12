'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Grid,
  Stack,
  Chip,
  Paper,
  useTheme,
} from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { motion } from 'framer-motion';
import { springs } from '../../theme/motion';
import GlassCard from '../landing/GlassCard';

interface StepProps {
  onFinish: () => void;
}

export const CompletionStep: React.FC<StepProps> = ({ onFinish }) => {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={springs.entrance}>
      <GlassCard sx={{ p: { xs: 3, md: 5 }, textAlign: 'center' }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '28px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)',
          }}
        >
          <EmojiEventsIcon sx={{ color: '#ffffff', fontSize: 44 }} />
        </Box>

        <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, color: 'text.primary', letterSpacing: '-0.02em' }}>
          Congratulations!
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520, mx: 'auto', mb: 3, fontSize: '1.05rem' }}>
          Your professional profile onboarding is 100% complete! Your AI career companion is active and matching you with open roles.
        </Typography>

        <Chip
          label="PROFILE 100% READY"
          color="success"
          sx={{ fontWeight: 900, px: 2, py: 1, fontSize: '0.9rem', mb: 4 }}
        />

        {/* Quick Action Cards */}
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, textAlign: 'left' }}>
          Recommended Next Actions
        </Typography>

        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[
            { title: 'Browse Jobs', desc: 'Explore 90%+ AI matched job openings.', icon: <WorkIcon sx={{ color: '#6366f1' }} />, route: '/jobs' },
            { title: 'Find Connections', desc: 'Connect with corporate recruiters.', icon: <PeopleIcon sx={{ color: '#ec4899' }} />, route: '/networking' },
            { title: 'Join Communities', desc: 'Engage in active industry guilds.', icon: <GroupsIcon sx={{ color: '#10b981' }} />, route: '/communities' },
          ].map((act, idx) => (
            <Grid item xs={12} sm={4} key={idx}>
              <Paper
                elevation={0}
                onClick={() => router.push(act.route)}
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'transform 0.2s ease',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
              >
                <Box sx={{ mb: 1 }}>{act.icon}</Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {act.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                  {act.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Button
          variant="contained"
          size="large"
          onClick={onFinish}
          startIcon={<DashboardIcon />}
          sx={{
            py: 1.8,
            px: 5,
            borderRadius: '14px',
            fontSize: '1.05rem',
            fontWeight: 800,
            textTransform: 'none',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
          }}
        >
          Open Main Dashboard
        </Button>
      </GlassCard>
    </motion.div>
  );
};

export default CompletionStep;

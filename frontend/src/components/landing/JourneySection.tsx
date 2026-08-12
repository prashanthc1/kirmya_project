'use client';

import React from 'react';
import { Box, Container, Grid, Typography, Stack, useTheme } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import SendIcon from '@mui/icons-material/Send';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { motion } from 'framer-motion';
import { stagger } from '../../theme/motion';
import GlassCard from './GlassCard';

export const JourneySection: React.FC = () => {
  const theme = useTheme();

  const steps = [
    { num: '01', title: 'Create Profile', desc: 'Set up your free Kirmya profile and career preferences.', icon: <PersonIcon sx={{ color: '#6366f1' }} /> },
    { num: '02', title: 'Upload Resume', desc: 'Upload your existing CV or build one from scratch.', icon: <UploadFileIcon sx={{ color: '#ec4899' }} /> },
    { num: '03', title: 'AI Analysis', desc: 'Instant AI review for ATS readiness and skill gap detection.', icon: <AutoAwesomeIcon sx={{ color: '#10b981' }} /> },
    { num: '04', title: 'Find Jobs', desc: 'Browse AI-matched opportunities with 90%+ match scores.', icon: <SearchIcon sx={{ color: '#f59e0b' }} /> },
    { num: '05', title: 'Apply & Refer', desc: 'Submit one-click applications and request employee referrals.', icon: <SendIcon sx={{ color: '#06b6d4' }} /> },
    { num: '06', title: 'Interview Prep', desc: 'Practice role-specific mock interviews with AI feedback.', icon: <QuestionAnswerIcon sx={{ color: '#8b5cf6' }} /> },
    { num: '07', title: 'Receive Offer', desc: 'Secure your new position and celebrate your career recovery!', icon: <EmojiEventsIcon sx={{ color: '#eab308' }} /> },
  ];

  return (
    <Box id="journey" sx={{ py: 12, position: 'relative' }}>
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              letterSpacing: 2,
              color: 'primary.main',
              textTransform: 'uppercase',
              display: 'block',
              mb: 1,
            }}
          >
            STEP-BY-STEP RECOVERY
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, color: 'text.primary' }}>
            Your Job Seeker Journey
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 650, mx: 'auto', fontSize: '1.05rem' }}>
            A proven 7-step roadmap designed to take you from job search to signed offer faster.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {steps.map((st, idx) => (
            <Grid item xs={12} sm={6} md={3} lg={1.71} key={idx} sx={{ flexGrow: 1 }}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={stagger(idx, 0.1)}
              >
                <GlassCard sx={{ height: '100%', p: 2.5, position: 'relative' }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 900,
                      color: 'rgba(99, 102, 241, 0.25)',
                      position: 'absolute',
                      top: 12,
                      right: 16,
                    }}
                  >
                    {st.num}
                  </Typography>
                  <Stack spacing={1.5} sx={{ mt: 1 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '12px',
                        bgcolor: 'rgba(99, 102, 241, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {st.icon}
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                      {st.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem', lineHeight: 1.5 }}>
                      {st.desc}
                    </Typography>
                  </Stack>
                </GlassCard>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default JourneySection;

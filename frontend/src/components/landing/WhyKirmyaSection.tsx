'use client';

import React from 'react';
import { Box, Container, Grid, Typography, Stack, useTheme } from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import SpeedIcon from '@mui/icons-material/Speed';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import GlassCard from './GlassCard';

export const WhyKirmyaSection: React.FC = () => {
  const theme = useTheme();

  const cards = [
    {
      icon: <HealthAndSafetyIcon sx={{ fontSize: 32, color: '#6366f1' }} />,
      title: 'Helping Professionals Recover After Layoffs',
      description: 'Dedicated support, career transition toolkits, and community solidarity to rebuild confidence.',
    },
    {
      icon: <PeopleAltIcon sx={{ fontSize: 32, color: '#ec4899' }} />,
      title: 'Authentic Professional Networking',
      description: 'Connect directly with hiring managers, internal advocates, and industry mentors.',
    },
    {
      icon: <AutoAwesomeIcon sx={{ fontSize: 32, color: '#10b981' }} />,
      title: 'AI-Powered Career Guidance',
      description: 'Real-time resume scoring, automated cover letter generation, and interview coaching.',
    },
    {
      icon: <CardGiftcardIcon sx={{ fontSize: 32, color: '#f59e0b' }} />,
      title: 'Free Platform For Job Seekers',
      description: '100% free access to all profile building, job matching, and AI tools for candidates.',
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 32, color: '#06b6d4' }} />,
      title: 'Fast Application Process',
      description: 'One-click smart applications with pre-filled verified credentials and instant ATS checks.',
    },
    {
      icon: <VerifiedUserIcon sx={{ fontSize: 32, color: '#8b5cf6' }} />,
      title: 'Trusted Corporate Employers',
      description: 'Vetted companies actively hiring with transparent salary ranges and direct recruiter contact.',
    },
  ];

  return (
    <Box id="why-kirmya" sx={{ py: 12, position: 'relative' }}>
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
            OUR MISSION & PURPOSE
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, color: 'text.primary' }}>
            Why Choose Kirmya?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 680, mx: 'auto', fontSize: '1.05rem' }}>
            Built specifically to eliminate career anxiety, empower job seekers with AI tools, and connect talent directly with opportunities.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {cards.map((card, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <GlassCard sx={{ height: '100%' }}>
                <Stack spacing={2}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: '14px',
                      bgcolor: 'rgba(99, 102, 241, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.3 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                    {card.description}
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

export default WhyKirmyaSection;

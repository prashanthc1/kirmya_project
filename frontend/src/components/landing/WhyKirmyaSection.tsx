'use client';

import React from 'react';
import { Box, Container, Grid, Typography, Stack, Card, CardContent, useTheme } from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import SpeedIcon from '@mui/icons-material/Speed';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { tokens } from '../../theme/tokens';

export const WhyKirmyaSection: React.FC = () => {
  const theme = useTheme();

  const cards = [
    {
      icon: <HealthAndSafetyIcon sx={{ fontSize: 28, color: 'primary.main' }} />,
      title: 'Helping Professionals Recover After Layoffs',
      description: 'Dedicated support, transition guidance, and community solidarity to rebuild momentum quickly.',
    },
    {
      icon: <PeopleAltIcon sx={{ fontSize: 28, color: 'secondary.main' }} />,
      title: 'Authentic Professional Networking',
      description: 'Connect directly with hiring managers, internal advocates, and industry mentors.',
    },
    {
      icon: <AutoAwesomeIcon sx={{ fontSize: 28, color: 'success.main' }} />,
      title: 'AI-Powered Career Guidance',
      description: 'Real-time resume scoring, tailored cover letter drafting, and structured interview coaching.',
    },
    {
      icon: <CardGiftcardIcon sx={{ fontSize: 28, color: 'warning.main' }} />,
      title: '100% Free For Candidates',
      description: 'Full access to profile building, job matching, referrals, and career tools with zero hidden fees.',
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 28, color: 'info.main' }} />,
      title: 'Direct Application Process',
      description: 'Submit smart applications directly to hiring teams with verified credentials and ATS validation.',
    },
    {
      icon: <VerifiedUserIcon sx={{ fontSize: 28, color: 'primary.main' }} />,
      title: 'Verified Employers & Transparency',
      description: 'Vetted companies actively hiring with clear salary ranges and responsive recruiters.',
    },
  ];

  return (
    <Box
      id="why-kirmya"
      component="section"
      aria-labelledby="why-kirmya-title"
      sx={{ py: { xs: 8, md: 10 }, bgcolor: 'background.default' }}
    >
      <Container maxWidth="xl">
        <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 }, maxWidth: 700, mx: 'auto' }}>
          <Typography
            variant="overline"
            sx={{
              fontWeight: 700,
              color: 'primary.main',
              letterSpacing: '0.08em',
              display: 'block',
              mb: 1,
            }}
          >
            Why Kirmya
          </Typography>
          <Typography
            id="why-kirmya-title"
            variant="h2"
            sx={{
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              mb: 1.5,
            }}
          >
            Built for professional momentum.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            A calm, purposeful platform designed to connect talent with opportunities without the visual noise of traditional networks.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {cards.map((card, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                elevation={1}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: `${tokens.radius.lg}px`,
                }}
              >
                <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ mb: 2 }}>{card.icon}</Box>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 700, mb: 1, lineHeight: 1.3 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {card.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default WhyKirmyaSection;

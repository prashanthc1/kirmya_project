'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container, Grid, Typography, Button, Stack, Chip, useTheme } from '@mui/material';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import GlassCard from './GlassCard';

export const RecruiterSection: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();

  const benefits = [
    'Find Quality Pre-Screened Candidates',
    'AI Candidate Vector Ranking & Matching',
    'Full-Featured Applicant Tracking System (ATS)',
    'Enhanced Employer & Company Branding',
    'Real-Time Hiring & Time-to-Fill Analytics',
    'Continuous Active Talent Pipeline Management',
  ];

  return (
    <Box id="recruiters" sx={{ py: 10, position: 'relative' }}>
      <Container maxWidth="xl">
        <GlassCard sx={{ p: { xs: 3, md: 5 } }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip
                icon={<BusinessCenterIcon sx={{ color: '#6366f1 !important' }} />}
                label="FOR RECRUITERS & HIRING MANAGERS"
                sx={{
                  fontWeight: 800,
                  px: 1,
                  mb: 2,
                  bgcolor: 'rgba(99, 102, 241, 0.15)',
                  color: 'primary.main',
                }}
              />
              <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, color: 'text.primary' }}>
                Hire Top Talent 3x Faster with AI Vector Ranking
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.7, fontSize: '1.05rem' }}>
                Cut through resume noise. Kirmya matches open positions with verified candidates based on actual skill proficiencies and career trajectories.
              </Typography>

              <Grid container spacing={2} sx={{ mb: 4 }}>
                {benefits.map((b, idx) => (
                  <Grid item xs={12} sm={6} key={idx}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CheckCircleOutlineIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {b}
                      </Typography>
                    </Stack>
                  </Grid>
                ))}
              </Grid>

              <Button
                variant="contained"
                size="large"
                onClick={() => router.push('/recruiter')}
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: '12px',
                  fontWeight: 800,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
                }}
              >
                Post a Job Now
              </Button>
            </Grid>

            <Grid item xs={12} md={5}>
              <Box
                sx={{
                  p: 3,
                  borderRadius: '18px',
                  bgcolor: 'rgba(99, 102, 241, 0.08)',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', mb: 1 }}>
                  4.8x
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                  Higher Candidate Response Rate
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Recruiters on Kirmya connect directly with verified candidates who are actively seeking new roles.
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </GlassCard>
      </Container>
    </Box>
  );
};

export default RecruiterSection;

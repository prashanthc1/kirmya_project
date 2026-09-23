'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Grid,
  Typography,
  Button,
  Stack,
  Chip,
  Avatar,
  Paper,
  useTheme,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SearchIcon from '@mui/icons-material/Search';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import { tokens } from '../../theme/tokens';
import { ROUTES } from '../../shared/routes';

export const HeroSection: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Box
      component="section"
      aria-labelledby="hero-heading"
      sx={{
        pt: { xs: 4, sm: 6, md: 8 },
        pb: { xs: 8, sm: 10, md: 12 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
          {/* Left Column: Value Proposition & CTAs */}
          <Grid item xs={12} md={7}>
            <Box>
              <Chip
                icon={<AutoAwesomeIcon sx={{ fontSize: 16, color: `${theme.palette.primary.main} !important` }} />}
                label="AI-Powered Career Recovery & Professional Network"
                size="small"
                sx={{
                  fontWeight: 700,
                  px: 1,
                  py: 0.5,
                  mb: 2.5,
                  bgcolor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider',
                  color: 'primary.main',
                  height: 'auto',
                  '& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 },
                }}
              />

              <Typography
                id="hero-heading"
                variant="h1"
                sx={{
                  fontSize: { xs: '2.25rem', sm: '3.25rem', md: '3.75rem' },
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: '-0.035em',
                  mb: 2.5,
                  color: 'text.primary',
                }}
              >
                Restart your career with confidence.
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  fontSize: { xs: '1rem', md: '1.15rem' },
                  lineHeight: 1.6,
                  color: 'text.secondary',
                  mb: 4,
                  maxWidth: 580,
                }}
              >
                Kirmya helps professionals recover from career transitions, connect with peer communities, receive verified employee referrals, and match with verified employers through AI guidance.
              </Typography>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                alignItems={{ xs: 'stretch', sm: 'center' }}
              >
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() => router.push(ROUTES.AUTH.SIGNUP)}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    py: 1.5,
                    px: 3.5,
                    fontSize: '1rem',
                    borderRadius: `${tokens.radius.md}px`,
                  }}
                >
                  Get Started Free
                </Button>

                <Button
                  variant="outlined"
                  color="inherit"
                  size="large"
                  onClick={() => router.push(ROUTES.JOBS)}
                  startIcon={<SearchIcon />}
                  sx={{
                    py: 1.5,
                    px: 3,
                    fontSize: '1rem',
                    borderRadius: `${tokens.radius.md}px`,
                    borderColor: theme.palette.divider,
                  }}
                >
                  Explore Jobs
                </Button>
              </Stack>

              <Button
                variant="text"
                color="inherit"
                onClick={() => router.push(ROUTES.FOR_RECRUITERS)}
                sx={{
                  alignSelf: { xs: 'stretch', sm: 'flex-start' },
                  mt: 1.5,
                  px: 0.5,
                  color: 'text.secondary',
                  fontWeight: 600,
                  textTransform: 'none',
                }}
              >
                Hiring talent? See Kirmya for recruiters →
              </Button>

              {/* Trust Indicators */}
              <Stack direction="row" spacing={3} alignItems="center" sx={{ mt: 4, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <VerifiedUserIcon sx={{ color: 'success.main', fontSize: 20 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    100% Free for Job Seekers
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <WorkOutlineIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Verified Employer Postings
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Grid>

          {/* Right Column: Apple-Inspired Product Card Preview */}
          <Grid item xs={12} md={5}>
            <Box>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: `${tokens.radius.lg}px`,
                  bgcolor: 'background.paper',
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                {/* Header Widget */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 2.5 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ width: 44, height: 44, bgcolor: theme.palette.primary.main, fontWeight: 700 }}>
                      K
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Senior Full Stack Engineer
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        TechCorp • Remote
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip label="98% Match" color="success" size="small" sx={{ fontWeight: 700 }} />
                </Stack>

                {/* Job Card Details */}
                <Stack spacing={1.5} sx={{ mb: 2.5, p: 2, bgcolor: 'action.hover', borderRadius: `${tokens.radius.sm}px` }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <LocationOnIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      San Francisco, CA • $160,000 - $190,000 / yr
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                    Matched to your profile via AI Career Optimizer based on Go, TypeScript, and distributed systems skills.
                  </Typography>
                </Stack>

                {/* Card Action */}
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => router.push(ROUTES.JOBS)}
                  sx={{ borderRadius: `${tokens.radius.sm}px` }}
                >
                  View Job & Apply
                </Button>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HeroSection;

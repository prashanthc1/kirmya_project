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
import { motion } from 'framer-motion';
import GlassCard from './GlassCard';

export const HeroSection: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        pt: { xs: 6, md: 10 },
        pb: { xs: 10, md: 14 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background Gradients & Blobs */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          left: '10%',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, rgba(236, 72, 153, 0.08) 70%, transparent 100%)',
          filter: 'blur(70px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '5%',
          right: '5%',
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.18) 0%, rgba(99, 102, 241, 0.05) 70%, transparent 100%)',
          filter: 'blur(80px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={6} alignItems="center">
          {/* Left Column: Headlines & CTAs */}
          <Grid item xs={12} md={7}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <Chip
                icon={<AutoAwesomeIcon sx={{ color: isDark ? '#a5b4fc !important' : '#4f46e5 !important' }} />}
                label="AI-Powered Career Recovery & Growth Platform"
                sx={{
                  fontWeight: 700,
                  px: 1,
                  py: 0.5,
                  mb: 3,
                  background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: isDark ? '#a5b4fc' : '#4f46e5',
                }}
              />

              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.2rem' },
                  fontWeight: 900,
                  lineHeight: 1.12,
                  letterSpacing: '-0.03em',
                  mb: 2.5,
                  color: 'text.primary',
                }}
              >
                Restart Your Career With{' '}
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Confidence.
                </Box>
              </Typography>

              <Typography
                variant="h6"
                color="text.secondary"
                sx={{
                  fontWeight: 400,
                  lineHeight: 1.65,
                  mb: 4,
                  maxWidth: 620,
                  fontSize: { xs: '1rem', md: '1.2rem' },
                }}
              >
                Find jobs, build professional connections, receive referrals, improve your skills, and accelerate your career with AI-powered guidance.
              </Typography>

              {/* CTAs */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 6 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => router.push('/jobs')}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    py: 1.8,
                    px: 4,
                    borderRadius: '14px',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                    },
                  }}
                >
                  Find Jobs
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => router.push('/signup')}
                  sx={{
                    py: 1.8,
                    px: 4,
                    borderRadius: '14px',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    textTransform: 'none',
                    borderColor: 'rgba(99, 102, 241, 0.3)',
                    color: 'text.primary',
                    backdropFilter: 'blur(8px)',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'rgba(99, 102, 241, 0.08)',
                    },
                  }}
                >
                  Create Free Account
                </Button>
              </Stack>

              {/* Live Statistics Pills */}
              <Grid container spacing={2} sx={{ pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                {[
                  { value: '150K+', label: 'Active Professionals' },
                  { value: '25K+', label: 'Open Jobs' },
                  { value: '4.8K+', label: 'Hiring Companies' },
                  { value: '94%', label: 'Successful Placements' },
                ].map((stat, idx) => (
                  <Grid item xs={6} sm={3} key={idx}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main' }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {stat.label}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </motion.div>
          </Grid>

          {/* Right Column: AI Interactive Glass Illustration & Dashboard Preview */}
          <Grid item xs={12} md={5}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <GlassCard sx={{ position: 'relative' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44, fontWeight: 900 }}>AI</Avatar>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                        Kirmya Career Companion
                      </Typography>
                      <Stack direction="row" spacing={0.8} alignItems="center">
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981' }} />
                        <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>
                          Active Match Engine
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                  <Chip label="94% Match" color="success" size="small" sx={{ fontWeight: 800 }} />
                </Box>

                {/* Dashboard Preview Card */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    borderRadius: '16px',
                    bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    mb: 2.5,
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Chip label="RECOMMENDED FOR YOU" size="small" sx={{ fontSize: '0.65rem', fontWeight: 800, bgcolor: 'rgba(99, 102, 241, 0.15)', color: 'primary.main' }} />
                    <VerifiedUserIcon sx={{ fontSize: 16, color: '#10b981' }} />
                  </Stack>
                  <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                    Senior Facilities Coordinator
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                    <LocationOnIcon fontSize="small" color="primary" /> Dubai, UAE • Emaar Properties
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip label="Vendor Management" size="small" variant="outlined" sx={{ fontSize: '0.72rem' }} />
                    <Chip label="HSE Compliance" size="small" variant="outlined" sx={{ fontSize: '0.72rem' }} />
                    <Chip label="$65K - $85K" size="small" color="primary" sx={{ fontSize: '0.72rem', fontWeight: 700 }} />
                  </Stack>
                </Paper>

                {/* Floating Glass Card 1 */}
                <Box
                  sx={{
                    p: 1.8,
                    borderRadius: '14px',
                    bgcolor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
                    mb: 1.5,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 700, mb: 0.5 }}>
                    ⚡ AI Resume Optimization Insight:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    "Added 4 high-impact keywords for ATS screening approval."
                  </Typography>
                </Box>
              </GlassCard>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default HeroSection;

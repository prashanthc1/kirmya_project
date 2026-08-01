'use client';

import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Stack,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import SchoolIcon from '@mui/icons-material/School';
import AuthCard from './AuthCard';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        bgcolor: isDark ? '#090d16' : '#f8fafc',
        backgroundImage: isDark
          ? 'radial-gradient(circle at 15% 15%, rgba(99, 102, 241, 0.18) 0%, transparent 45%), radial-gradient(circle at 85% 85%, rgba(236, 72, 153, 0.15) 0%, transparent 45%)'
          : 'radial-gradient(circle at 15% 15%, rgba(99, 102, 241, 0.08) 0%, transparent 45%), radial-gradient(circle at 85% 85%, rgba(236, 72, 153, 0.05) 0%, transparent 45%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 4, md: 6 },
        px: { xs: 2, sm: 4 },
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={4} alignItems="center" justifyContent="center">
          {/* Left Section: Branding, Recovery Message & 4 Feature Cards */}
          <Grid item xs={12} md={6} lg={6.5}>
            <Box sx={{ pr: { md: 4 } }}>
              {/* Kirmya Logo Badge */}
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: '1.4rem',
                    boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35)',
                  }}
                >
                  K
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.02em', color: 'text.primary' }}>
                  KIRMYA
                </Typography>
                <Chip
                  icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
                  label="Career Recovery Platform"
                  size="small"
                  sx={{
                    fontWeight: 700,
                    px: 0.5,
                    background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: isDark ? '#a5b4fc' : '#4f46e5',
                  }}
                />
              </Stack>

              {/* Main Headline & Career Recovery Mission Statement */}
              <Typography
                variant={isMobile ? 'h4' : 'h2'}
                component="h1"
                sx={{
                  fontWeight: 900,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.15,
                  mb: 2,
                  color: 'text.primary',
                }}
              >
                Accelerate Your{' '}
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Career Recovery & Growth
                </Box>
              </Typography>

              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 4, maxWidth: 540, fontSize: { xs: '1rem', md: '1.15rem' }, fontWeight: 500 }}
              >
                Helping professionals rebuild their career journey faster with verified connections, internal referrals, and AI career tools.
              </Typography>

              {/* 4 Feature Cards */}
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6}>
                  <FeatureCard
                    icon={<SearchIcon sx={{ color: '#6366f1' }} />}
                    title="1. Find your next opportunity"
                    description="Access verified job openings tailored to your experience."
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FeatureCard
                    icon={<PeopleIcon sx={{ color: '#ec4899' }} />}
                    title="2. Connect with professionals"
                    description="Network with decision makers, hiring managers, and industry peers."
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FeatureCard
                    icon={<CardGiftcardIcon sx={{ color: '#10b981' }} />}
                    title="3. Get referrals"
                    description="Request direct employee referrals to fast-track interview scheduling."
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FeatureCard
                    icon={<SchoolIcon sx={{ color: '#f59e0b' }} />}
                    title="4. Improve your skills"
                    description="Enhance your profile with real-time AI interview practice and feedback."
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Right Section: Glassmorphism Auth Card */}
          <Grid item xs={12} md={6} lg={5.5}>
            <AuthCard>{children}</AuthCard>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => (
  <Box
    sx={{
      p: 2.2,
      borderRadius: '16px',
      bgcolor: 'rgba(99, 102, 241, 0.05)',
      border: '1px solid rgba(99, 102, 241, 0.15)',
      backdropFilter: 'blur(10px)',
      height: '100%',
      transition: 'transform 0.2s ease, border-color 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        borderColor: 'rgba(99, 102, 241, 0.35)',
      },
    }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: '10px',
          bgcolor: 'rgba(99, 102, 241, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
        {title}
      </Typography>
    </Stack>
    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
      {description}
    </Typography>
  </Box>
);

export default AuthLayout;

'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container, Typography, Button, Stack, useTheme } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SearchIcon from '@mui/icons-material/Search';
import { motion } from 'framer-motion';

export const CTASection: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();

  return (
    <Box
      sx={{
        py: { xs: 10, md: 14 },
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #ec4899 100%)',
        color: '#ffffff',
        textAlign: 'center',
      }}
    >
      {/* Background Glass Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              fontSize: { xs: '2.2rem', sm: '3.2rem', md: '3.8rem' },
              lineHeight: 1.15,
              mb: 2.5,
              letterSpacing: '-0.02em',
            }}
          >
            Start Your Career Journey Today
          </Typography>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 400,
              opacity: 0.92,
              mb: 5,
              maxWidth: 680,
              mx: 'auto',
              lineHeight: 1.6,
              fontSize: { xs: '1rem', md: '1.2rem' },
            }}
          >
            Join over 150,000 professionals accelerating their career recovery with AI guidance, verified networking, and employee referrals.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push('/signup')}
              endIcon={<ArrowForwardIcon />}
              sx={{
                py: 1.8,
                px: 4.5,
                borderRadius: '14px',
                fontSize: '1.05rem',
                fontWeight: 800,
                textTransform: 'none',
                bgcolor: '#ffffff',
                color: '#4f46e5',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
                '&:hover': {
                  bgcolor: '#f8fafc',
                  color: '#3730a3',
                },
              }}
            >
              Create Free Account
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={() => router.push('/jobs')}
              startIcon={<SearchIcon />}
              sx={{
                py: 1.8,
                px: 4.5,
                borderRadius: '14px',
                fontSize: '1.05rem',
                fontWeight: 700,
                textTransform: 'none',
                borderColor: '#ffffff',
                color: '#ffffff',
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  borderColor: '#ffffff',
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                },
              }}
            >
              Browse Jobs
            </Button>
          </Stack>
        </motion.div>
      </Container>
    </Box>
  );
};

export default CTASection;

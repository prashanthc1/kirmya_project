'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SearchIcon from '@mui/icons-material/Search';

export const CTASection: React.FC = () => {
  const router = useRouter();

  return (
    <Box
      sx={{
        py: { xs: 10, md: 14 },
        position: 'relative',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        color: 'text.primary',
        borderTop: '1px solid',
        borderColor: 'divider',
        textAlign: 'center',
      }}
    >
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Box>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
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
              color: 'text.secondary',
              mb: 5,
              maxWidth: 680,
              mx: 'auto',
              lineHeight: 1.6,
              fontSize: { xs: '1rem', md: '1.2rem' },
            }}
          >
            Accelerate your career recovery with AI guidance, verified networking, and employee referrals.
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
                fontWeight: 700,
                textTransform: 'none',
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
              }}
            >
              Browse Jobs
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default CTASection;

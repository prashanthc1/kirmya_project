'use client';

import React, { useState } from 'react';
import { Box, Container, Typography, Stack, Button } from '@mui/material';
import Link from 'next/link';

import RecruiterSection from '../../components/landing/RecruiterSection';
import CTASection from '../../components/landing/CTASection';
import Footer from '../../components/landing/Footer';
import { AppHeader } from '../../components/shell/AppHeader';
import { MobileDrawer } from '../../components/shell/MobileDrawer';
import { ROUTES } from '../../shared/routes';
import { tokens } from '../../theme/tokens';

/**
 * Employer-facing landing. Recruiters get /for-recruiters; companies that want
 * a branded hiring presence land here. Shared tooling (ATS, posting) is the
 * same product — the copy is aimed at hiring managers and founders.
 */
export default function ForEmployersPage() {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100dvh' }}>
      <AppHeader onMobileNavOpen={() => setMobileDrawerOpen(true)} />
      <MobileDrawer open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />

      <Box component="main">
        <Container maxWidth="md" sx={{ pt: { xs: 6, md: 8 }, pb: 2 }}>
          <Stack spacing={2}>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 800 }}>
              Hire with Kirmya
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.05rem', lineHeight: 1.7 }}>
              Post roles, review applications, and keep your employer brand in one workspace.
              Built for hiring managers and founders who need a working pipeline — not a brochure.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                component={Link}
                href={ROUTES.AUTH.SIGNUP}
                variant="contained"
                sx={{ borderRadius: `${tokens.radius.md}px` }}
              >
                Create an employer account
              </Button>
              <Button
                component={Link}
                href={ROUTES.FOR_RECRUITERS}
                variant="outlined"
                sx={{ borderRadius: `${tokens.radius.md}px` }}
              >
                Recruiter tools
              </Button>
            </Stack>
          </Stack>
        </Container>
        <RecruiterSection />
        <CTASection />
      </Box>

      <Footer />
    </Box>
  );
}

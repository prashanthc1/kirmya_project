'use client';

import React, { useState } from 'react';
import { Box, Container, Typography, Stack, Button } from '@mui/material';
import Link from 'next/link';

import Footer from '../../components/landing/Footer';
import { AppHeader } from '../../components/shell/AppHeader';
import { MobileDrawer } from '../../components/shell/MobileDrawer';
import { ROUTES } from '../../shared/routes';
import { tokens } from '../../theme/tokens';

/**
 * Public About page.
 *
 * Footer and marketing links pointed at /about, which previously 404'd.
 * This is a short, honest company page — not fabricated scale claims.
 */
export default function AboutPage() {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100dvh' }}>
      <AppHeader onMobileNavOpen={() => setMobileDrawerOpen(true)} />
      <MobileDrawer open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />

      <Box component="main">
        <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
          <Stack spacing={3}>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 800 }}>
              About Kirmya
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.05rem', lineHeight: 1.7 }}>
              Kirmya is a career companion for people looking for work and for teams who hire them.
              The product combines job search, applications, resumes, and recruiter tools in one
              place — without charging job seekers to use the core platform.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.05rem', lineHeight: 1.7 }}>
              We are building in the open. Features ship when they work, and public pages only
              claim numbers we can actually count.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1 }}>
              <Button
                component={Link}
                href={ROUTES.JOBS}
                variant="contained"
                sx={{ borderRadius: `${tokens.radius.md}px` }}
              >
                Browse jobs
              </Button>
              <Button
                component={Link}
                href={ROUTES.FOR_RECRUITERS}
                variant="outlined"
                sx={{ borderRadius: `${tokens.radius.md}px` }}
              >
                Hiring? See recruiter tools
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}

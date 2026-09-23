'use client';

import React, { useState } from 'react';
import { Box } from '@mui/material';

import RecruiterSection from '../../components/landing/RecruiterSection';
import CTASection from '../../components/landing/CTASection';
import Footer from '../../components/landing/Footer';
import { AppHeader } from '../../components/shell/AppHeader';
import { MobileDrawer } from '../../components/shell/MobileDrawer';

/**
 * Dedicated landing for recruiters and hiring managers.
 *
 * Recruiter messaging was removed from the public homepage so that page can
 * focus on job seekers. This route is the primary entry for employer value
 * props, ATS benefits, and "Post a Job" conversion.
 */
export default function ForRecruitersPage() {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100dvh' }}>
      <AppHeader onMobileNavOpen={() => setMobileDrawerOpen(true)} />
      <MobileDrawer open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />

      <Box component="main">
        <RecruiterSection />
        <CTASection />
      </Box>

      <Footer />
    </Box>
  );
}

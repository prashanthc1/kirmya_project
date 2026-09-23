'use client';

import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';

import HeroSection from '../components/landing/HeroSection';
import StatisticsSection from '../components/landing/StatisticsSection';
import WhyKirmyaSection from '../components/landing/WhyKirmyaSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import FAQSection from '../components/landing/FAQSection';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/landing/Footer';
import { AppHeader } from '../components/shell/AppHeader';
import { MobileDrawer } from '../components/shell/MobileDrawer';

import { useAuth } from '../hooks/useAuth';
import FeedPage from './feed/page';
import { landingApi } from '../features/landing/api';
import { LandingContentResponse } from '../features/landing/types';

/**
 * Public marketing homepage — focused on the primary audience: job seekers.
 *
 * Previously rendered 14+ major sections (AI Assistant, Journey, Networking,
 * Communities, Recruiter, Company, etc.) on a single page. That mixed audiences,
 * diluted the value proposition, and created heavy scroll fatigue.
 *
 * Current structure (in order):
 *  1. Hero + primary CTAs
 *  2. Real platform statistics (only when API returns counts)
 *  3. Why Kirmya
 *  4. Core features
 *  5. Real testimonials (only when present)
 *  6. FAQ
 *  7. Final CTA
 *
 * Recruiter / company / networking content belongs on dedicated landing pages
 * (e.g. /for-recruiters) rather than competing on the public homepage.
 */
export default function HomePage() {
  const { authenticated, loading } = useAuth();
  const [content, setContent] = useState<LandingContentResponse | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    landingApi.getLandingContent().then((res) => setContent(res)).catch(() => {});
  }, []);

  // Authenticated users skip the marketing page and land on the Feed.
  if (!loading && authenticated) {
    return <FeedPage />;
  }

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100dvh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'Kirmya',
            url: 'https://kirmya.com',
            description:
              'A free professional networking and AI-powered career recovery platform helping people find jobs, build connections, improve skills, and recover careers faster.',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://kirmya.com/jobs?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />

      <AppHeader onMobileNavOpen={() => setMobileDrawerOpen(true)} />
      <MobileDrawer open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />

      <Box component="main">
        <HeroSection />
        <StatisticsSection statistics={content?.platform_statistics} />
        <WhyKirmyaSection />
        <FeaturesSection />
        <TestimonialsSection testimonials={content?.testimonials} />
        <FAQSection />
        <CTASection />
      </Box>

      <Footer />
    </Box>
  );
}

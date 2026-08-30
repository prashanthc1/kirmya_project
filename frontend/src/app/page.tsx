'use client';

import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';

import HeroSection from '../components/landing/HeroSection';
import StatisticsSection from '../components/landing/StatisticsSection';
import WhyKirmyaSection from '../components/landing/WhyKirmyaSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import AIAssistantSection from '../components/landing/AIAssistantSection';
import JourneySection from '../components/landing/JourneySection';
import NetworkingSection from '../components/landing/NetworkingSection';
import CommunitiesSection from '../components/landing/CommunitiesSection';
import RecruiterSection from '../components/landing/RecruiterSection';
import CompanySection from '../components/landing/CompanySection';
import TestimonialsSection from '../components/landing/TestimonialsSection';
import MetricsSection from '../components/landing/MetricsSection';
import FAQSection from '../components/landing/FAQSection';
import CTASection from '../components/landing/CTASection';
import Footer from '../components/landing/Footer';
import { AppHeader } from '../components/shell/AppHeader';
import { MobileDrawer } from '../components/shell/MobileDrawer';

import { useAuth } from '../hooks/useAuth';
import FeedPage from './feed/page';
import { landingApi } from '../features/landing/api';
import { LandingContentResponse } from '../features/landing/types';

export default function HomePage() {
  const { authenticated, loading } = useAuth();
  const [content, setContent] = useState<LandingContentResponse | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  useEffect(() => {
    landingApi.getLandingContent().then((res) => setContent(res)).catch(() => {});
  }, []);

  // If user is authenticated, serve the authenticated Feed directly
  if (!loading && authenticated) {
    return <FeedPage />;
  }

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100dvh' }}>
      {/* Schema.org Structured Data */}
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

      {/* 1. Global Application Header */}
      <AppHeader onMobileNavOpen={() => setMobileDrawerOpen(true)} />

      {/* Mobile Drawer */}
      <MobileDrawer open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />

      {/* 2. Main Landmark for Accessibility */}
      <main id="main-content">
        {/* 3. Hero Section */}
        <HeroSection />

        {/* 4. Trusted Statistics */}
        <StatisticsSection />

        {/* 5. Why Kirmya Value Propositions */}
        <WhyKirmyaSection />

        {/* 6. Core Features */}
        <FeaturesSection />

        {/* 7. AI Career Assistant */}
        <AIAssistantSection />

        {/* 8. Career Recovery Journey */}
        <JourneySection />

        {/* 9. Networking & Referrals */}
        <NetworkingSection />

        {/* 10. Communities */}
        <CommunitiesSection />

        {/* 11. Recruiter Solutions */}
        <RecruiterSection />

        {/* 12. Verified Companies */}
        <CompanySection />

        {/* 13. Testimonials */}
        <TestimonialsSection testimonials={content?.testimonials} />

        {/* 14. Metrics */}
        <MetricsSection />

        {/* 15. FAQ Accordion */}
        <FAQSection />

        {/* 16. Final Call To Action */}
        <CTASection />
      </main>

      {/* 17. Standardized Footer */}
      <Footer />
    </Box>
  );
}

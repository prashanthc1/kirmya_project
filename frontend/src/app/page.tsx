'use client';

import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Navbar from '../components/landing/Navbar';
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

import { landingApi } from '../features/landing/api';
import { LandingContentResponse } from '../features/landing/types';

export default function KirmyaLandingPage() {
  const [content, setContent] = useState<LandingContentResponse | null>(null);

  useEffect(() => {
    landingApi.getLandingContent().then((res) => setContent(res)).catch(() => {});
  }, []);

  return (
    <Box sx={{ bgcolor: 'background.default', color: 'text.primary', minHeight: '100dvh', transition: 'background-color 0.3s ease' }}>
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
              'A free professional networking and AI-powered career platform helping people find jobs, build connections, improve skills, and recover careers faster.',
            potentialAction: {
              '@type': 'SearchAction',
              target: 'https://kirmya.com/jobs?q={search_term_string}',
              'query-input': 'required name=search_term_string',
            },
          }),
        }}
      />

      {/* 1. Sticky Navigation Bar */}
      <Navbar />

      {/* 2. Hero Section */}
      <HeroSection />

      {/* 3. Trusted By / Statistics */}
      <StatisticsSection />

      {/* 4. Why Kirmya */}
      <WhyKirmyaSection />

      {/* 5. Features Section */}
      <FeaturesSection />

      {/* 6. AI Career Assistant */}
      <AIAssistantSection />

      {/* 7. Job Search Journey */}
      <JourneySection />

      {/* 8. Networking & Referrals */}
      <NetworkingSection />

      {/* 9. Communities */}
      <CommunitiesSection />

      {/* 10. Recruiter Section */}
      <RecruiterSection />

      {/* 11. Company Section */}
      <CompanySection />

      {/* 12. Testimonials */}
      <TestimonialsSection testimonials={content?.testimonials} />

      {/* 13. Success Metrics */}
      <MetricsSection />

      {/* 14. FAQ Accordion */}
      <FAQSection />

      {/* 15. Call To Action */}
      <CTASection />

      {/* 16. Footer */}
      <Footer />
    </Box>
  );
}

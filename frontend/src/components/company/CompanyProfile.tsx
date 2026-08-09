'use client';

/**
 * Shell for the public company pages.
 *
 * Loads the company once and shares it with whichever tab is mounted, so the
 * header, the tab bar and the tab content always describe the same row. The
 * viewer context that arrives with the company decides which management entry
 * points appear; the server decides whether they work.
 */
import React from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Container,
  Skeleton,
  Stack,
  Tab,
  Tabs,
} from '@mui/material';

import { useCompany } from '../../features/company/hooks';
import { CompanyDetail } from '../../features/company/types';
import CompanyHeader from './CompanyHeader';
import useAuth from '../../hooks/useAuth';

export type CompanyTab = 'home' | 'about' | 'jobs' | 'people' | 'reviews' | 'updates';

const TABS: Array<{ value: CompanyTab; label: string; segment: string }> = [
  { value: 'home', label: 'Home', segment: '' },
  { value: 'about', label: 'About', segment: '/about' },
  { value: 'jobs', label: 'Jobs', segment: '/jobs' },
  { value: 'people', label: 'People', segment: '/people' },
  { value: 'reviews', label: 'Reviews', segment: '/reviews' },
  { value: 'updates', label: 'Updates', segment: '/updates' },
];

interface CompanyProfileProps {
  slug: string;
  activeTab: CompanyTab;
  children: (company: CompanyDetail) => React.ReactNode;
}

export const CompanyProfile: React.FC<CompanyProfileProps> = ({ slug, activeTab, children }) => {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data: company, isLoading, isError, error } = useCompany(slug);

  const requireSignIn = React.useCallback(() => {
    router.push(`/signin?redirect=${encodeURIComponent(`/company/${slug}`)}`);
  }, [router, slug]);

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="rounded" height={220} sx={{ borderRadius: '24px' }} />
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          <Skeleton variant="circular" width={110} height={110} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="40%" height={48} />
            <Skeleton variant="text" width="60%" />
          </Box>
        </Stack>
        <Skeleton variant="rounded" height={320} sx={{ mt: 4, borderRadius: '16px' }} />
      </Container>
    );
  }

  if (isError || !company) {
    // The API answers 404 for a company the caller may not see, so a missing
    // company and a forbidden one look identical here on purpose.
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Alert severity="error" sx={{ borderRadius: '16px' }}>
          <AlertTitle>Company not found</AlertTitle>
          {error?.message || 'This company page is not available.'}
          <Box sx={{ mt: 2 }}>
            <Button component={NextLink} href="/company" variant="outlined" size="small">
              Browse companies
            </Button>
          </Box>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
      <CompanyHeader
        company={company}
        identifier={slug}
        isAuthenticated={isAuthenticated}
        onRequireSignIn={requireSignIn}
      />

      <Tabs
        value={activeTab}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label="Company sections"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {TABS.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            label={tab.label}
            component={NextLink}
            href={`/company/${company.slug}${tab.segment}`}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          />
        ))}
      </Tabs>

      <Box component="section">{children(company)}</Box>
    </Container>
  );
};

export default CompanyProfile;

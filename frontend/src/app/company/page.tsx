'use client';

/**
 * The company directory.
 *
 * Everything on this page is public: it lists companies, never the people at
 * them. The "Following" tab is the one exception and is the signed-in user's
 * own list, so it is not rendered at all for an anonymous visitor.
 */
import React from 'react';
import NextLink from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Container,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import AddBusinessOutlinedIcon from '@mui/icons-material/AddBusinessOutlined';

import CompanyDiscovery from '../../components/company/CompanyDiscovery';
import CompanySearch from '../../components/company/CompanySearch';
import CompanySummaryCard from '../../components/company/CompanySummaryCard';
import { AutoGrid } from '../../components/company/CompanyBadges';
import { useFollowedCompanies } from '../../features/company/hooks';
import useAuth from '../../hooks/useAuth';

type DirectoryTab = 'discover' | 'search' | 'following';

const FollowingPanel: React.FC = () => {
  const { data, isLoading, isError, error } = useFollowedCompanies();

  if (isLoading) {
    return (
      <AutoGrid min={300}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={170} sx={{ borderRadius: '16px' }} />
        ))}
      </AutoGrid>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" sx={{ borderRadius: '16px' }}>
        {error?.message || 'Your followed companies could not be loaded.'}
      </Alert>
    );
  }

  const companies = data?.items ?? [];
  if (companies.length === 0) {
    return (
      <Typography variant="body1" color="text.secondary">
        You are not following any companies yet. Following one adds its updates and new jobs to
        your feed.
      </Typography>
    );
  }

  return (
    <AutoGrid min={300}>
      {companies.map((company) => (
        <CompanySummaryCard key={company.id} company={company} />
      ))}
    </AutoGrid>
  );
};

const CompanyDirectory: React.FC = () => {
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  const initialQuery = searchParams?.get('q') ?? '';
  // Arriving with a query means the visitor already knows what they are looking
  // for, so the search tab opens instead of the browsing rails.
  const [tab, setTab] = React.useState<DirectoryTab>(initialQuery ? 'search' : 'discover');

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ sm: 'flex-end' }}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 900 }}>
            Companies
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Find employers on Kirmya, follow the ones you care about, and see what they are hiring
            for.
          </Typography>
        </Box>

        <Button
          component={NextLink}
          href="/company/create"
          variant="contained"
          startIcon={<AddBusinessOutlinedIcon />}
          sx={{ textTransform: 'none', flexShrink: 0 }}
        >
          Create a company page
        </Button>
      </Stack>

      <Tabs
        value={tab}
        onChange={(_, value: DirectoryTab) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label="Company directory sections"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="discover" label="Discover" sx={{ textTransform: 'none', fontWeight: 600 }} />
        <Tab value="search" label="All companies" sx={{ textTransform: 'none', fontWeight: 600 }} />
        {isAuthenticated && (
          <Tab value="following" label="Following" sx={{ textTransform: 'none', fontWeight: 600 }} />
        )}
      </Tabs>

      <Box role="tabpanel">
        {tab === 'discover' && <CompanyDiscovery />}
        {tab === 'search' && <CompanySearch initialQuery={initialQuery} />}
        {tab === 'following' && isAuthenticated && <FollowingPanel />}
      </Box>
    </Container>
  );
};

export default function CompanyDirectoryPage() {
  // `useSearchParams` reads the query string, which is not known while the shell
  // is prerendered, so the boundary is required rather than decorative.
  return (
    <React.Suspense
      fallback={
        <Container maxWidth="lg" sx={{ py: 5 }}>
          <Skeleton variant="text" width={280} height={56} />
          <Skeleton variant="rounded" height={420} sx={{ mt: 3, borderRadius: '20px' }} />
        </Container>
      }
    >
      <CompanyDirectory />
    </React.Suspense>
  );
}

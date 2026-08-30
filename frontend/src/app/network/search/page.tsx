'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  Stack,
  Button,
  Skeleton,
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthenticatedLayout from '../../../components/shell/AuthenticatedLayout';
import PeopleSearchBar from '../../../components/network/PeopleSearchBar';
import PeopleFilters, { PeopleFilterState } from '../../../components/network/PeopleFilters';
import PeopleResultCard from '../../../components/network/PeopleResultCard';
import { PeopleSearchResult, networkingApi } from '../../../features/networking/services/networkingApi';
import { tokens } from '../../../theme/tokens';

export const dynamic = 'force-dynamic';

function NetworkSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<PeopleFilterState>({
    role: searchParams.get('role') || '',
    company: searchParams.get('company') || '',
    skills: searchParams.get('skills') || '',
    industry: searchParams.get('industry') || '',
    location: searchParams.get('location') || '',
    degree: searchParams.get('degree') || 'all',
    openToWork: searchParams.get('openToWork') === 'true',
  });
  const [results, setResults] = useState<PeopleSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchResults = useCallback(async (q: string, currentFilters: PeopleFilterState) => {
    setLoading(true);
    try {
      const data = await networkingApi.searchPeople({
        query: q || currentFilters.role,
        company: currentFilters.company,
        skills: currentFilters.skills,
        industry: currentFilters.industry,
        location: currentFilters.location,
        degree: currentFilters.degree !== 'all' ? currentFilters.degree : undefined,
        openToWork: currentFilters.openToWork ? true : undefined,
      });
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(query, filters);
  }, [query, filters, fetchResults]);

  const handleReset = () => {
    const defaultFilters: PeopleFilterState = {
      role: '',
      company: '',
      skills: '',
      industry: '',
      location: '',
      degree: 'all',
      openToWork: false,
    };
    setFilters(defaultFilters);
    setQuery('');
    router.replace('/network/search');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}>
          Search Network & Professionals
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find professionals across roles, companies, skill sets, and geographic regions.
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <PeopleSearchBar
          initialValue={query}
          onSearch={(q) => {
            setQuery(q);
            const params = new URLSearchParams();
            if (q) params.set('q', q);
            const qs = params.toString();
            router.replace(`/network/search${qs ? `?${qs}` : ''}`);
          }}
        />
      </Box>

      <PeopleFilters filters={filters} onChange={setFilters} onReset={handleReset} />

      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Results ({results.length})
        </Typography>
      </Box>

      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rounded" height={220} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
            </Grid>
          ))}
        </Grid>
      ) : results.length > 0 ? (
        <Grid container spacing={3}>
          {results.map((person) => (
            <Grid item xs={12} sm={6} md={4} key={person.userId}>
              <PeopleResultCard person={person} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            borderRadius: `${tokens.radius.lg}px`,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            No professionals found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Try adjusting your search query or broadening your filters.
          </Typography>
          <Button
            variant="outlined"
            onClick={handleReset}
            sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700 }}
          >
            Clear Filters
          </Button>
        </Box>
      )}
    </Container>
  );
}

export default function NetworkSearchPage() {
  return (
    <AuthenticatedLayout>
      <Suspense fallback={null}>
        <NetworkSearchContent />
      </Suspense>
    </AuthenticatedLayout>
  );
}

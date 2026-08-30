'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Stack,
  Button,
  Skeleton,
  Alert,
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthenticatedLayout from '../../components/shell/AuthenticatedLayout';
import PeopleSearchBar from '../../components/network/PeopleSearchBar';
import PeopleFilters, { PeopleFilterState } from '../../components/network/PeopleFilters';
import PeopleResultCard from '../../components/network/PeopleResultCard';
import RecommendationCard from '../../components/network/RecommendationCard';
import {
  PeopleSearchResult,
  ConnectionRecommendation,
  networkingApi,
} from '../../features/networking/services/networkingApi';
import { tokens } from '../../theme/tokens';

export const dynamic = 'force-dynamic';

function PeopleDiscoveryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [people, setPeople] = useState<PeopleSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<ConnectionRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<PeopleFilterState>({
    role: searchParams.get('role') || '',
    company: searchParams.get('company') || '',
    skills: searchParams.get('skills') || '',
    industry: searchParams.get('industry') || '',
    location: searchParams.get('location') || '',
    degree: searchParams.get('degree') || 'all',
    openToWork: searchParams.get('openToWork') === 'true',
  });

  const loadData = useCallback(async (query: string, currentFilters: PeopleFilterState) => {
    setLoading(true);
    setError(null);
    try {
      const [peopleData, suggestionsData] = await Promise.all([
        networkingApi.searchPeople({
          query,
          role: currentFilters.role,
          company: currentFilters.company,
          skills: currentFilters.skills,
          industry: currentFilters.industry,
          location: currentFilters.location,
          degree: currentFilters.degree !== 'all' ? currentFilters.degree : undefined,
          openToWork: currentFilters.openToWork ? true : undefined,
        }),
        networkingApi.getSuggestions(),
      ]);
      setPeople(peopleData);
      setSuggestions(suggestionsData);
    } catch {
      setError('Unable to load people discovery results. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(searchQuery, filters);
  }, [searchQuery, filters, loadData]);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (filters.role) params.set('role', filters.role);
    if (filters.company) params.set('company', filters.company);
    if (filters.location) params.set('location', filters.location);
    if (filters.industry) params.set('industry', filters.industry);
    const qs = params.toString();
    router.replace(`/people${qs ? `?${qs}` : ''}`);
  };

  const handleResetFilters = () => {
    const empty: PeopleFilterState = {
      role: '',
      company: '',
      skills: '',
      industry: '',
      location: '',
      degree: 'all',
      openToWork: false,
    };
    setFilters(empty);
    setSearchQuery('');
    router.replace('/people');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}>
          People Discovery
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Find professionals, colleagues, and industry peers to expand your network.
        </Typography>
      </Box>

      {/* Search Bar & Filter Toggle */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <PeopleSearchBar
          initialValue={searchQuery}
          onSearch={handleSearch}
          placeholder="Search by name, role, company, or skills..."
        />
        <Button
          variant={showFilters ? 'contained' : 'outlined'}
          onClick={() => setShowFilters(!showFilters)}
          sx={{
            borderRadius: `${tokens.radius.md}px`,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            px: 3,
          }}
        >
          {showFilters ? 'Hide Filters' : 'Filters'}
        </Button>
      </Stack>

      {/* Collapsible Filter Panel */}
      {showFilters && (
        <PeopleFilters
          filters={filters}
          onChange={(newFilters) => setFilters(newFilters)}
          onReset={handleResetFilters}
        />
      )}

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: `${tokens.radius.sm}px` }}
          action={
            <Button color="inherit" size="small" onClick={() => loadData(searchQuery, filters)}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* People Search Results */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {searchQuery ? `Search Results (${people.length})` : `All Professionals (${people.length})`}
          </Typography>
        </Stack>

        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rounded" height={220} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
              </Grid>
            ))}
          </Grid>
        ) : people.length > 0 ? (
          <Grid container spacing={3}>
            {people.map((person) => (
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
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
              {searchQuery
                ? `No people matched "${searchQuery}". Try broadening your search or adjusting filters.`
                : 'Try adjusting your filters or searching for specific roles, skills, or companies.'}
            </Typography>
            <Button
              variant="outlined"
              onClick={handleResetFilters}
              sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700 }}
            >
              Clear All Filters
            </Button>
          </Box>
        )}
      </Box>

      {/* Recommended Suggestions Carousel */}
      {!searchQuery && suggestions.length > 0 && (
        <Box sx={{ mt: 5 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Recommended For You
          </Typography>
          <Grid container spacing={3}>
            {suggestions.slice(0, 4).map((cand) => (
              <Grid item xs={12} sm={6} key={cand.userId}>
                <RecommendationCard
                  cand={cand}
                  onDismiss={() => setSuggestions((prev) => prev.filter((s) => s.userId !== cand.userId))}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
}

export default function PeopleDiscoveryPage() {
  return (
    <AuthenticatedLayout>
      <Suspense fallback={null}>
        <PeopleDiscoveryContent />
      </Suspense>
    </AuthenticatedLayout>
  );
}

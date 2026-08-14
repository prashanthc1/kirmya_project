'use client';

import React, { useEffect, useState } from 'react';
import { Container, Grid, Typography, Box, CircularProgress, Stack, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PeopleSearchBar from '@/components/network/PeopleSearchBar';
import PeopleFilters from '@/components/network/PeopleFilters';
import PeopleResultCard from '@/components/network/PeopleResultCard';
import RecommendationCard from '@/components/network/RecommendationCard';
import Link from 'next/link';
import { PeopleSearchResult, ConnectionRecommendation, networkingApi } from '@/features/networking/services/networkingApi';

export default function PeopleDiscoveryPage() {
  const [people, setPeople] = useState<PeopleSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<ConnectionRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});

  const handleSearch = (query: string) => {
    setLoading(true);
    networkingApi
      .searchPeople({ query, ...filters })
      .then((data) => setPeople(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([
      networkingApi.searchPeople(),
      networkingApi.getSuggestions(),
    ])
      .then(([pData, sData]) => {
        setPeople(pData);
        setSuggestions(sData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fallbackPeople: PeopleSearchResult[] = people.length > 0 ? people : [
    {
      id: 'res-1',
      userId: '11112222-3333-4444-5555-666677778888',
      username: 'ayeshas',
      name: 'Ayesha Siddiqui',
      avatarUrl: '',
      headline: 'Next.js Frontend Architect',
      currentPosition: 'Lead UI Architect @ TechVentures',
      location: 'Abu Dhabi, UAE',
      industry: 'Technology',
      openToWork: true,
      mutualCount: 2,
      mutualConnections: ['Salim Al-Harthy'],
      connectionStatus: 'none',
      isFollowing: false,
      verificationStatus: 'verified',
    },
    {
      id: 'res-2',
      userId: '99998888-7777-6666-5555-444433332222',
      username: 'fatima_a',
      name: 'Fatima Al-Suwaidi',
      avatarUrl: '',
      headline: 'Product Owner & Fintech Lead',
      currentPosition: 'Senior Product Owner @ Emirates Fintech',
      location: 'Dubai, UAE',
      industry: 'Finance',
      openToWork: false,
      mutualCount: 1,
      mutualConnections: ['Salim Al-Harthy'],
      connectionStatus: 'none',
      isFollowing: false,
      verificationStatus: 'verified',
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            People & Professional Discovery
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Find peers, mentors, recruiters, and industry leaders tailored to your career recovery and goals.
          </Typography>
        </Box>

        <Button
          component={Link}
          href="/people/search"
          variant="contained"
          startIcon={<SearchIcon />}
          sx={{ borderRadius: '12px', fontWeight: 800 }}
        >
          Advanced People Search
        </Button>
      </Stack>

      <Box sx={{ mb: 3 }}>
        <PeopleSearchBar onSearch={handleSearch} />
      </Box>

      <PeopleFilters filters={filters} onChange={setFilters} onReset={() => setFilters({})} />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
            Suggested Connection Recommendations
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {suggestions.slice(0, 2).map((cand) => (
              <Grid item xs={12} sm={6} key={cand.userId}>
                <RecommendationCard cand={cand} />
              </Grid>
            ))}
          </Grid>

          <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
            Discovered Professionals
          </Typography>
          <Grid container spacing={3}>
            {fallbackPeople.map((person) => (
              <Grid item xs={12} sm={6} md={4} key={person.userId}>
                <PeopleResultCard person={person} />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Container>
  );
}

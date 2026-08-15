'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Container, Typography, Grid, Box, CircularProgress } from '@mui/material';
import PeopleFilters, { PeopleFilterState } from '@/components/network/PeopleFilters';
import PeopleResultCard from '@/components/network/PeopleResultCard';
import { PeopleSearchResult, networkingApi } from '@/features/networking/services/networkingApi';

export default function NetworkSearchPage() {
  const [filters, setFilters] = useState<PeopleFilterState>({
    role: '',
    company: '',
    skills: '',
    industry: '',
    location: '',
    degree: 'all',
    openToWork: false,
  });
  const [results, setResults] = useState<PeopleSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchResults = useCallback(async (currentFilters: PeopleFilterState) => {
    setLoading(true);
    try {
      const data = await networkingApi.searchPeople({
        query: currentFilters.role,
        company: currentFilters.company,
        skills: currentFilters.skills,
        industry: currentFilters.industry,
        location: currentFilters.location,
        degree: currentFilters.degree !== 'all' ? currentFilters.degree : undefined,
        openToWork: currentFilters.openToWork,
      });
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(filters);
  }, [filters, fetchResults]);

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
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
        Discover & Search Professional Members
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Find potential connections, peers, recruiters, and industry partners.
      </Typography>

      <PeopleFilters filters={filters} onChange={(newFilters) => setFilters(newFilters)} onReset={handleReset} />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress color="primary" />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {results.map((person) => (
            <Grid item xs={12} sm={6} md={4} key={person.userId || person.id}>
              <PeopleResultCard person={person} onStatusChange={() => fetchResults(filters)} />
            </Grid>
          ))}

          {results.length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  No professional profiles matched your search criteria.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting or resetting your filter criteria above.
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}
    </Container>
  );
}

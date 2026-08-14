'use client';

import React, { useState } from 'react';
import { Container, Typography, Box, Grid } from '@mui/material';
import PeopleSearchBar from '@/components/network/PeopleSearchBar';
import PeopleFilters from '@/components/network/PeopleFilters';
import PeopleResultCard from '@/components/network/PeopleResultCard';
import { PeopleSearchResult, networkingApi } from '@/features/networking/services/networkingApi';

export default function PeopleSearchPage() {
  const [results, setResults] = useState<PeopleSearchResult[]>([]);
  const [filters, setFilters] = useState({});

  const handleSearch = (query: string) => {
    networkingApi.searchPeople({ query, ...filters }).then((data) => setResults(data));
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
        Advanced Professional People Search
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Search by multi-word keywords, role, company, skills, or location. Server-side privacy enforced.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <PeopleSearchBar onSearch={handleSearch} placeholder="Type name, company, role, or skills..." />
      </Box>

      <PeopleFilters filters={filters} onChange={setFilters} onReset={() => setFilters({})} />

      <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
        Search Results ({results.length})
      </Typography>

      <Grid container spacing={3}>
        {results.map((person) => (
          <Grid item xs={12} sm={6} md={4} key={person.userId}>
            <PeopleResultCard person={person} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

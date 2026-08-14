'use client';

import React, { useState } from 'react';
import { Container, Typography, Box, Stack } from '@mui/material';
import PeopleSearchBar from '@/components/network/PeopleSearchBar';
import ConnectionCard from '@/components/network/ConnectionCard';
import { ConnectionRecommendation, networkingApi } from '@/features/networking/services/networkingApi';

export default function NetworkSearchPage() {
  const [results, setResults] = useState<ConnectionRecommendation[]>([]);

  const handleSearch = (q: string) => {
    networkingApi.listConnections().then((conns) => {
      if (!q) {
        setResults(conns);
        return;
      }
      const lower = q.toLowerCase();
      setResults(conns.filter((c) => c.name?.toLowerCase().includes(lower) || c.headline?.toLowerCase().includes(lower)));
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
        Search Within Your Network
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Query your 1st-degree connection graph exclusively.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <PeopleSearchBar onSearch={handleSearch} placeholder="Search your contacts by name or title..." />
      </Box>

      <Stack spacing={2}>
        {results.map((conn) => (
          <ConnectionCard key={conn.userId} connection={conn} />
        ))}
      </Stack>
    </Container>
  );
}

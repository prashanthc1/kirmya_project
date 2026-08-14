'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Stack } from '@mui/material';
import ConnectionCard from '@/components/network/ConnectionCard';
import PeopleSearchBar from '@/components/network/PeopleSearchBar';
import { ConnectionRecommendation, networkingApi } from '@/features/networking/services/networkingApi';

export default function NetworkConnectionsPage() {
  const [connections, setConnections] = useState<ConnectionRecommendation[]>([]);
  const [filtered, setFiltered] = useState<ConnectionRecommendation[]>([]);

  useEffect(() => {
    networkingApi.listConnections().then((data) => {
      setConnections(data);
      setFiltered(data);
    });
  }, []);

  const handleSearch = (q: string) => {
    if (!q) {
      setFiltered(connections);
      return;
    }
    const lower = q.toLowerCase();
    setFiltered(
      connections.filter(
        (c) =>
          c.name?.toLowerCase().includes(lower) ||
          c.headline?.toLowerCase().includes(lower) ||
          c.location?.toLowerCase().includes(lower)
      )
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
        1st-Degree Connections ({filtered.length})
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Search and manage your established professional contacts.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <PeopleSearchBar onSearch={handleSearch} placeholder="Filter your 1st-degree connections..." />
      </Box>

      <Stack spacing={2}>
        {filtered.map((conn) => (
          <ConnectionCard
            key={conn.userId}
            connection={conn}
            onRemove={() => setFiltered(filtered.filter((item) => item.userId !== conn.userId))}
          />
        ))}
      </Stack>
    </Container>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Stack, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ConnectionCard from '@/components/network/ConnectionCard';
import { ConnectionRecommendation, networkingApi } from '@/features/networking/services/networkingApi';

export default function NetworkConnectionsPage() {
  const [connections, setConnections] = useState<ConnectionRecommendation[]>([]);
  const [query, setQuery] = useState('');
  const [filtered, setFiltered] = useState<ConnectionRecommendation[]>([]);

  useEffect(() => {
    networkingApi.listConnections().then((data) => {
      setConnections(data);
      setFiltered(data);
    });
  }, []);

  const handleSearchChange = (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setFiltered(connections);
      return;
    }
    const lower = q.toLowerCase();
    setFiltered(
      connections.filter(
        (c) =>
          c.name?.toLowerCase().includes(lower) ||
          c.headline?.toLowerCase().includes(lower) ||
          c.location?.toLowerCase().includes(lower) ||
          c.industry?.toLowerCase().includes(lower)
      )
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
        1st-Degree Connections ({filtered.length})
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Search, organize with private notes & labels, and manage your direct professional graph.
      </Typography>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Filter 1st-degree contacts by name, headline, location, or industry..."
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '16px',
              bgcolor: 'background.paper',
            },
          }}
        />
      </Box>

      <Stack spacing={2}>
        {filtered.map((conn) => (
          <ConnectionCard
            key={conn.userId}
            connection={conn}
            onRemove={() => {
              const updated = connections.filter((item) => item.userId !== conn.userId);
              setConnections(updated);
              setFiltered(updated.filter((c) => c.name?.toLowerCase().includes(query.toLowerCase())));
            }}
          />
        ))}

        {filtered.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4, fontStyle: 'italic' }}>
            No connections found matching &quot;{query}&quot;.
          </Typography>
        )}
      </Stack>
    </Container>
  );
}

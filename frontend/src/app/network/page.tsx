'use client';

import React, { useEffect, useState } from 'react';
import { Container, Grid, Typography, Box, Stack, Button, Tabs, Tab } from '@mui/material';
import NetworkStats from '@/components/network/NetworkStats';
import ConnectionCard from '@/components/network/ConnectionCard';
import RecommendationCard from '@/components/network/RecommendationCard';
import Link from 'next/link';
import { ConnectionRecommendation, ConnectionRequestItem, networkingApi } from '@/features/networking/services/networkingApi';

export default function MyNetworkPage() {
  const [connections, setConnections] = useState<ConnectionRecommendation[]>([]);
  const [suggestions, setSuggestions] = useState<ConnectionRecommendation[]>([]);
  const [incoming, setIncoming] = useState<ConnectionRequestItem[]>([]);

  useEffect(() => {
    Promise.all([
      networkingApi.listConnections(),
      networkingApi.getSuggestions(),
      networkingApi.listIncomingRequests(),
    ])
      .then(([c, s, i]) => {
        setConnections(c);
        setSuggestions(s);
        setIncoming(i);
      })
      .catch(() => {});
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            My Professional Network
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage your 1st-degree connections, invitations, and AI recommendation suggestions.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button component={Link} href="/network/connections" variant="outlined" sx={{ borderRadius: '12px', fontWeight: 800 }}>
            My Connections ({connections.length})
          </Button>
          <Button component={Link} href="/network/requests" variant="contained" sx={{ borderRadius: '12px', fontWeight: 800 }}>
            Pending Invites ({incoming.length})
          </Button>
        </Stack>
      </Stack>

      <NetworkStats />

      <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
        Suggested Connection Recommendations
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {suggestions.map((cand) => (
          <Grid item xs={12} sm={6} key={cand.userId}>
            <RecommendationCard cand={cand} />
          </Grid>
        ))}
      </Grid>

      <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
        Recent 1st-Degree Connections
      </Typography>
      <Stack spacing={2}>
        {connections.map((conn) => (
          <ConnectionCard key={conn.userId} connection={conn} />
        ))}
      </Stack>
    </Container>
  );
}

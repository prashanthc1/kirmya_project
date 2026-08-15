'use client';

import React, { useEffect, useState } from 'react';
import { Container, Grid, Typography, Box, Stack, Button, Divider } from '@mui/material';
import NetworkStats from '@/components/network/NetworkStats';
import NetworkingGoalsCard from '@/components/network/NetworkingGoalsCard';
import ReferralDiscoveryCard from '@/components/network/ReferralDiscoveryCard';
import ConnectionCard from '@/components/network/ConnectionCard';
import RecommendationCard from '@/components/network/RecommendationCard';
import Link from 'next/link';
import {
  ConnectionRecommendation,
  ConnectionRequestItem,
  NetworkGrowthStats,
  networkingApi,
} from '@/features/networking/services/networkingApi';

export default function MyNetworkDashboardPage() {
  const [connections, setConnections] = useState<ConnectionRecommendation[]>([]);
  const [suggestions, setSuggestions] = useState<ConnectionRecommendation[]>([]);
  const [incoming, setIncoming] = useState<ConnectionRequestItem[]>([]);
  const [stats, setStats] = useState<NetworkGrowthStats | undefined>(undefined);

  useEffect(() => {
    Promise.all([
      networkingApi.listConnections(),
      networkingApi.getSuggestions(),
      networkingApi.listIncomingRequests(),
      networkingApi.getNetworkStats(),
    ])
      .then(([c, s, i, st]) => {
        setConnections(c);
        setSuggestions(s);
        setIncoming(i);
        setStats(st);
      })
      .catch(() => {});
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mb: 4 }} gap={2}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            My Professional Network
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage your 1st-degree connection graph, invitations, referral discovery & growth goals.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} flexWrap="wrap">
          <Button component={Link} href="/network/search" variant="outlined" sx={{ borderRadius: '12px', fontWeight: 800 }}>
            Search People
          </Button>
          <Button component={Link} href="/network/connections" variant="outlined" sx={{ borderRadius: '12px', fontWeight: 800 }}>
            Connections ({connections.length})
          </Button>
          <Button component={Link} href="/network/requests" variant="contained" sx={{ borderRadius: '12px', fontWeight: 800 }}>
            Invitations ({incoming.length})
          </Button>
        </Stack>
      </Stack>

      <NetworkStats stats={stats} />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <NetworkingGoalsCard />
        </Grid>
        <Grid item xs={12} md={6}>
          <ReferralDiscoveryCard />
        </Grid>
      </Grid>

      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Suggested Connection Recommendations
          </Typography>
          <Button component={Link} href="/network/suggestions" size="small" sx={{ fontWeight: 800 }}>
            View All ({suggestions.length})
          </Button>
        </Stack>

        <Grid container spacing={3}>
          {suggestions.slice(0, 4).map((cand) => (
            <Grid item xs={12} sm={6} key={cand.userId}>
              <RecommendationCard
                cand={cand}
                onDismiss={() => setSuggestions(suggestions.filter((s) => s.userId !== cand.userId))}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Recent 1st-Degree Connections
          </Typography>
          <Button component={Link} href="/network/connections" size="small" sx={{ fontWeight: 800 }}>
            Manage Connections ({connections.length})
          </Button>
        </Stack>

        <Stack spacing={2}>
          {connections.slice(0, 5).map((conn) => (
            <ConnectionCard
              key={conn.userId}
              connection={conn}
              onRemove={() => setConnections(connections.filter((c) => c.userId !== conn.userId))}
            />
          ))}
        </Stack>
      </Box>
    </Container>
  );
}

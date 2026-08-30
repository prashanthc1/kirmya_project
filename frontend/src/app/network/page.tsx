'use client';

import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Stack,
  Button,
  Divider,
  Skeleton,
} from '@mui/material';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import SearchIcon from '@mui/icons-material/Search';
import Link from 'next/link';

import AuthenticatedLayout from '../../components/shell/AuthenticatedLayout';
import NetworkStats from '../../components/network/NetworkStats';
import NetworkingGoalsCard from '../../components/network/NetworkingGoalsCard';
import ReferralDiscoveryCard from '../../components/network/ReferralDiscoveryCard';
import ConnectionCard from '../../components/network/ConnectionCard';
import RecommendationCard from '../../components/network/RecommendationCard';
import {
  ConnectionRecommendation,
  ConnectionRequestItem,
  NetworkGrowthStats,
  networkingApi,
} from '../../features/networking/services/networkingApi';
import { tokens } from '../../theme/tokens';
import { ROUTES } from '../../shared/routes';

export const dynamic = 'force-dynamic';

export default function MyNetworkDashboardPage() {
  const [connections, setConnections] = useState<ConnectionRecommendation[]>([]);
  const [suggestions, setSuggestions] = useState<ConnectionRecommendation[]>([]);
  const [incoming, setIncoming] = useState<ConnectionRequestItem[]>([]);
  const [stats, setStats] = useState<NetworkGrowthStats | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      networkingApi.listConnections(),
      networkingApi.getSuggestions(),
      networkingApi.listIncomingRequests(),
      networkingApi.getNetworkStats(),
    ])
      .then(([c, s, i, st]) => {
        if (isMounted) {
          setConnections(c);
          setSuggestions(s);
          setIncoming(i);
          setStats(st);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AuthenticatedLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header Bar */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          sx={{ mb: 4 }}
          gap={2}
        >
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}>
              Professional Network
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your direct relationships, connection invitations, and intelligent recommendations.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" gap={1}>
            <Button
              component={Link}
              href="/network/search"
              variant="outlined"
              startIcon={<SearchIcon />}
              sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700 }}
            >
              Discover People
            </Button>
            <Button
              component={Link}
              href="/network/connections"
              variant="outlined"
              startIcon={<PeopleOutlineIcon />}
              sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700 }}
            >
              Connections ({connections.length})
            </Button>
            <Button
              component={Link}
              href="/network/requests"
              variant="contained"
              startIcon={<MailOutlineIcon />}
              sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700 }}
            >
              Invitations ({incoming.length})
            </Button>
          </Stack>
        </Stack>

        {/* Growth Stats Banner */}
        <NetworkStats stats={stats} />

        {/* Networking Goals & Referral Discovery Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <NetworkingGoalsCard />
          </Grid>
          <Grid item xs={12} md={6}>
            <ReferralDiscoveryCard />
          </Grid>
        </Grid>

        {/* Suggested Connection Recommendations */}
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Suggested Connections
            </Typography>
            <Button
              component={Link}
              href="/network/suggestions"
              size="small"
              sx={{ fontWeight: 700 }}
            >
              View All ({suggestions.length})
            </Button>
          </Stack>

          {loading ? (
            <Grid container spacing={3}>
              {[1, 2].map((i) => (
                <Grid item xs={12} sm={6} key={i}>
                  <Skeleton variant="rounded" height={160} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
                </Grid>
              ))}
            </Grid>
          ) : (
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
          )}
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Recent Connections */}
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              1st-Degree Connections
            </Typography>
            <Button
              component={Link}
              href="/network/connections"
              size="small"
              sx={{ fontWeight: 700 }}
            >
              Manage ({connections.length})
            </Button>
          </Stack>

          {loading ? (
            <Stack spacing={2}>
              {[1, 2].map((i) => (
                <Skeleton key={i} variant="rounded" height={120} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
              ))}
            </Stack>
          ) : connections.length > 0 ? (
            <Stack spacing={2}>
              {connections.slice(0, 5).map((conn) => (
                <ConnectionCard
                  key={conn.userId}
                  connection={conn}
                  onRemove={() => setConnections((prev) => prev.filter((c) => c.userId !== conn.userId))}
                />
              ))}
            </Stack>
          ) : (
            <Box
              sx={{
                textAlign: 'center',
                py: 6,
                borderRadius: `${tokens.radius.lg}px`,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                No 1st-degree connections yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Discover colleagues, industry peers, and alumni to expand your professional network.
              </Typography>
              <Button
                component={Link}
                href="/network/search"
                variant="contained"
                sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700 }}
              >
                Discover Professionals
              </Button>
            </Box>
          )}
        </Box>
      </Container>
    </AuthenticatedLayout>
  );
}

'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Stack,
  TextField,
  InputAdornment,
  Button,
  Skeleton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import Link from 'next/link';

import AuthenticatedLayout from '../../../components/shell/AuthenticatedLayout';
import ConnectionCard from '../../../components/network/ConnectionCard';
import { ConnectionRecommendation, Connection, networkingApi } from '../../../features/networking/services/networkingApi';
import { tokens } from '../../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function NetworkConnectionsPage() {
  const [connections, setConnections] = useState<(ConnectionRecommendation | Connection)[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    networkingApi
      .listConnections()
      .then((data) => {
        if (isMounted) {
          setConnections(data);
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

  const filtered = useMemo(() => {
    if (!query.trim()) return connections;
    const lower = query.toLowerCase();
    return connections.filter(
      (c) =>
        c.name?.toLowerCase().includes(lower) ||
        c.headline?.toLowerCase().includes(lower) ||
        c.location?.toLowerCase().includes(lower) ||
        c.industry?.toLowerCase().includes(lower)
    );
  }, [connections, query]);

  return (
    <AuthenticatedLayout>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          sx={{ mb: 3 }}
          gap={2}
        >
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}>
              1st-Degree Connections ({connections.length})
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Search, organize with private notes and labels, and message your direct contacts.
            </Typography>
          </Box>

          <Button
            component={Link}
            href="/people"
            variant="contained"
            startIcon={<PersonAddOutlinedIcon />}
            sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700 }}
          >
            Find New People
          </Button>
        </Stack>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search connections by name, role, company, or location..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              sx: {
                borderRadius: `${tokens.radius.md}px`,
                bgcolor: 'background.paper',
              },
            }}
          />
        </Box>

        {loading ? (
          <Stack spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rounded" height={130} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
            ))}
          </Stack>
        ) : filtered.length > 0 ? (
          <Stack spacing={2}>
            {filtered.map((conn) => (
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
              py: 8,
              borderRadius: `${tokens.radius.lg}px`,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              {query ? 'No matching connections' : 'No 1st-degree connections yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {query
                ? `No connections matched "${query}". Check for typos or clear your search.`
                : 'Start discovering professionals in your industry to build meaningful relationships.'}
            </Typography>
            {query ? (
              <Button
                variant="outlined"
                onClick={() => setQuery('')}
                sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700 }}
              >
                Clear Search
              </Button>
            ) : (
              <Button
                component={Link}
                href="/people"
                variant="contained"
                sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700 }}
              >
                Discover Professionals
              </Button>
            )}
          </Box>
        )}
      </Container>
    </AuthenticatedLayout>
  );
}

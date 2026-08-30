'use client';

import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Box,
  Skeleton,
  Button,
  Stack,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Link from 'next/link';

import AuthenticatedLayout from '../../../components/shell/AuthenticatedLayout';
import RecommendationCard from '../../../components/network/RecommendationCard';
import { ConnectionRecommendation, networkingApi } from '../../../features/networking/services/networkingApi';
import { tokens } from '../../../theme/tokens';

export const dynamic = 'force-dynamic';

export default function NetworkSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<ConnectionRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    networkingApi
      .getSuggestions()
      .then((data) => {
        if (isMounted) {
          setSuggestions(data);
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
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <AutoAwesomeIcon color="primary" />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            Recommended For You
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          People you may know based on shared industry, mutual connections, and complementary tech skills.
        </Typography>

        {loading ? (
          <Grid container spacing={3}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid item xs={12} sm={6} key={i}>
                <Skeleton variant="rounded" height={180} sx={{ borderRadius: `${tokens.radius.lg}px` }} />
              </Grid>
            ))}
          </Grid>
        ) : suggestions.length > 0 ? (
          <Grid container spacing={3}>
            {suggestions.map((cand) => (
              <Grid item xs={12} sm={6} key={cand.userId}>
                <RecommendationCard
                  cand={cand}
                  onDismiss={() => setSuggestions((prev) => prev.filter((s) => s.userId !== cand.userId))}
                />
              </Grid>
            ))}
          </Grid>
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
              No recommendations available right now
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Check back soon as new professionals join Kirmya or search directly.
            </Typography>
            <Button
              component={Link}
              href="/people"
              variant="contained"
              sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700 }}
            >
              Search Professionals
            </Button>
          </Box>
        )}
      </Container>
    </AuthenticatedLayout>
  );
}

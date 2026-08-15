'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Box } from '@mui/material';
import RecommendationCard from '@/components/network/RecommendationCard';
import { ConnectionRecommendation, networkingApi } from '@/features/networking/services/networkingApi';

export default function NetworkSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<ConnectionRecommendation[]>([]);

  useEffect(() => {
    networkingApi.getSuggestions().then((data) => setSuggestions(data));
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
        People You May Know & AI Recommendations
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Intelligent suggestions calculated based on shared industry, mutual connections, and complementary tech skills.
      </Typography>

      <Grid container spacing={3}>
        {suggestions.map((cand) => (
          <Grid item xs={12} sm={6} key={cand.userId}>
            <RecommendationCard
              cand={cand}
              onDismiss={() => setSuggestions(suggestions.filter((s) => s.userId !== cand.userId))}
            />
          </Grid>
        ))}

        {suggestions.length === 0 && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                No suggestions available right now.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check back later or search for people directly!
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
    </Container>
  );
}

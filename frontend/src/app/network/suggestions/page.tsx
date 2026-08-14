'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid } from '@mui/material';
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
        People You May Know & Suggested Connections
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Recommendations calculated based on mutual connections, shared industry, and professional skills.
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
      </Grid>
    </Container>
  );
}

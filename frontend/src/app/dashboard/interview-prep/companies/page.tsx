'use client';

import React from 'react';
import { Container, Grid, Typography, Box, Stack } from '@mui/material';
import { CompanyResearchCard } from '@/components/interview-prep/CompanyResearchCard';

export default function CompanyResearchPage() {
  const targetCompanies = [
    'Google',
    'Microsoft',
    'Amazon',
    'Stripe',
    'Meta',
    'Netflix',
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} sx={{ color: '#F8FAFC' }}>
          Target Company Research & Strategic Insights
        </Typography>
        <Typography variant="body1" sx={{ color: '#94A3B8' }}>
          Explore key cultural values, high-frequency interview prompts, and strategic questions for top tech companies.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {targetCompanies.map((cName, idx) => (
          <Grid item xs={12} md={6} key={idx}>
            <CompanyResearchCard companyName={cName} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

'use client';

import React from 'react';
import { Box, Typography, Grid, Chip, Stack } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CompanyCard from './CompanyCard';
import { CompanyDirectoryItem } from '../../features/companies/types';

interface RecommendationSectionProps {
  recommended: CompanyDirectoryItem[];
}

export const RecommendationSection: React.FC<RecommendationSectionProps> = ({ recommended }) => {
  if (!recommended || recommended.length === 0) return null;

  return (
    <Box sx={{ mb: 6 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <Chip
          icon={<AutoAwesomeIcon sx={{ color: '#a855f7 !important' }} />}
          label="AI RECOMMENDED FOR YOU"
          sx={{
            fontWeight: 800,
            bgcolor: 'rgba(168, 85, 247, 0.15)',
            color: '#a855f7',
            border: '1px solid rgba(168, 85, 247, 0.3)',
          }}
        />
        <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary' }}>
          Matched Based on Your Profile &amp; Preferences
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        {recommended.slice(0, 3).map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.company.id}>
            <CompanyCard item={item} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default RecommendationSection;

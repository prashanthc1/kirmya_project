'use client';

import React from 'react';
import { Box, Typography, Grid, Chip } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CompanyCard from './CompanyCard';
import { CompanyDirectoryItem } from '../../features/companies/types';

interface FeaturedCompaniesProps {
  companies: CompanyDirectoryItem[];
}

export const FeaturedCompanies: React.FC<FeaturedCompaniesProps> = ({ companies }) => {
  if (!companies || companies.length === 0) return null;

  return (
    <Box sx={{ mb: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Chip
          icon={<AutoAwesomeIcon sx={{ color: '#f59e0b !important' }} />}
          label="FEATURED EMPLOYERS"
          sx={{
            fontWeight: 800,
            bgcolor: 'rgba(245, 158, 11, 0.15)',
            color: '#f59e0b',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        />
        <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary' }}>
          Top Hiring &amp; Fast-Growing Companies
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {companies.slice(0, 3).map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.company.id}>
            <CompanyCard item={item} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default FeaturedCompanies;

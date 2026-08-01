'use client';

import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CompanyCard from './CompanyCard';
import { CompanyDirectoryItem } from '../../features/companies/types';

interface SavedCompaniesProps {
  saved: CompanyDirectoryItem[];
}

export const SavedCompanies: React.FC<SavedCompaniesProps> = ({ saved }) => {
  if (!saved || saved.length === 0) return null;

  return (
    <Box sx={{ mb: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <BookmarkIcon sx={{ color: '#f59e0b', fontSize: 30 }} />
        <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary' }}>
          Your Saved Favorite Companies
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {saved.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.company.id}>
            <CompanyCard item={item} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SavedCompanies;

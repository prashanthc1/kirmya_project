'use client';

import React from 'react';
import {
  Grid,
  Box,
  Typography,
  Pagination,
  Skeleton,
  Stack,
  Button,
} from '@mui/material';
import CompanyCard from './CompanyCard';
import { CompanyDirectoryItem } from '../../features/companies/types';

interface CompanyGridProps {
  companies: CompanyDirectoryItem[];
  loading?: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const CompanyGrid: React.FC<CompanyGridProps> = ({
  companies,
  loading = false,
  page,
  totalPages,
  onPageChange,
}) => {
  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <Grid item xs={12} sm={6} md={4} key={idx}>
            <Skeleton variant="rounded" height={280} sx={{ borderRadius: '20px' }} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (companies.length === 0) {
    return (
      <Box sx={{ textCenter: 'center', py: 8, px: 2, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          No Companies Found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Try adjusting your search criteria or resetting the active filters.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={3}>
        {companies.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.company.id}>
            <CompanyCard item={item} />
          </Grid>
        ))}
      </Grid>

      {totalPages > 1 && (
        <Stack direction="row" justifyContent="center" sx={{ mt: 5 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => onPageChange(p)}
            color="primary"
            size="large"
          />
        </Stack>
      )}
    </Box>
  );
};

export default CompanyGrid;

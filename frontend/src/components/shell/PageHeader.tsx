'use client';

import React from 'react';
import { Box, Typography, Stack } from '@mui/material';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

/**
 * Standardized Page Header for all application views.
 * Ensures consistent spacing, typography, and alignment of page titles and actions.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <Box sx={{ mb: { xs: 3, sm: 4 }, minWidth: 0 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.15, overflowWrap: 'anywhere', mb: subtitle ? 1 : 0 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: '65ch', lineHeight: 1.6 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {actions && (
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0, maxWidth: '100%' }}>
            {actions}
          </Box>
        )}
      </Stack>
    </Box>
  );
};

export default PageHeader;

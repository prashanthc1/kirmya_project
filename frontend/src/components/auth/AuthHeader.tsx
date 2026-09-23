'use client';

import React from 'react';
import { Box, Typography, Stack } from '@mui/material';
import BrandLockup from '../brand/BrandLockup';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ title, subtitle }) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" justifyContent="flex-start" alignItems="center" sx={{ mb: 2.5 }}>
        <BrandLockup size={40} variant="h5" />
      </Stack>

      <Typography variant="h5" component="h1" sx={{ fontWeight: 700, mb: 0.75, letterSpacing: '-0.02em' }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
        {subtitle}
      </Typography>
    </Box>
  );
};

export default AuthHeader;

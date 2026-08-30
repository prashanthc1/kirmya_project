'use client';

import React from 'react';
import { Box, Stack, Typography, Link as MuiLink } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import Link from 'next/link';

export const AuthFooter: React.FC = () => {
  return (
    <Box sx={{ mt: 3.5, pt: 2.5, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
      <Stack direction="row" spacing={1.5} justifyContent="center" alignItems="center" sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <LockOutlinedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            TLS Encrypted
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">•</Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <ShieldOutlinedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            Privacy Protected
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={2} justifyContent="center">
        <MuiLink component={Link} href="/terms" variant="caption" color="text.secondary" underline="hover">
          Terms of Service
        </MuiLink>
        <MuiLink component={Link} href="/privacy" variant="caption" color="text.secondary" underline="hover">
          Privacy Policy
        </MuiLink>
        <MuiLink component={Link} href="/help" variant="caption" color="text.secondary" underline="hover">
          Help & Support
        </MuiLink>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, opacity: 0.8 }}>
        © {new Date().getFullYear()} Kirmya. All rights reserved.
      </Typography>
    </Box>
  );
};

export default AuthFooter;

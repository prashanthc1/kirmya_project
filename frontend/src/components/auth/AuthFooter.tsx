'use client';

import React from 'react';
import { Box, Stack, Typography, Link as MuiLink } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import ShieldIcon from '@mui/icons-material/Shield';

export const AuthFooter: React.FC = () => {
  return (
    <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)', textAlign: 'center' }}>
      <Stack direction="row" spacing={1.5} justifyContent="center" alignItems="center" sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <LockIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            256-Bit SSL Encrypted
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary">•</Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <ShieldIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary">
            GDPR & SOC 2 Compliant
          </Typography>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={2} justifyContent="center">
        <MuiLink href="/terms" variant="caption" color="text.secondary" underline="hover">
          Terms of Service
        </MuiLink>
        <MuiLink href="/privacy" variant="caption" color="text.secondary" underline="hover">
          Privacy Policy
        </MuiLink>
        <MuiLink href="/help" variant="caption" color="text.secondary" underline="hover">
          Help & Support
        </MuiLink>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, opacity: 0.7 }}>
        © {new Date().getFullYear()} Kirmya Platform. All rights reserved.
      </Typography>
    </Box>
  );
};

export default AuthFooter;

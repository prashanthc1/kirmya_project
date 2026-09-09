'use client';

import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import Link from 'next/link';
import { routes } from '../../shared/routes';

export interface AccessDeniedProps {
  /** What was refused, phrased to complete "You do not have access to …". */
  label: string;
  detail?: string;
}

/**
 * The refusal a signed-in viewer sees on a route they may not open.
 *
 * Stated rather than redirected: bouncing someone silently reads as a broken
 * link, and they try again. This says what happened and offers the way back.
 */
export const AccessDenied: React.FC<AccessDeniedProps> = ({ label, detail }) => (
  <Box
    sx={{
      minHeight: '50dvh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 2,
      px: 3,
      textAlign: 'center',
    }}
  >
    <Typography variant="h5" component="h1" fontWeight={700}>
      You do not have access to {label}
    </Typography>
    {detail ? (
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480 }}>
        {detail}
      </Typography>
    ) : null}
    <Button component={Link} href={routes.feed()} variant="contained" sx={{ textTransform: 'none' }}>
      Back to your feed
    </Button>
  </Box>
);

export default AccessDenied;

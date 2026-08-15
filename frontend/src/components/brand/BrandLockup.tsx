import React from 'react';
import { Box, Stack, Typography, SxProps, Theme } from '@mui/material';

import BrandMark from './BrandMark';

/**
 * The Kirmya brand lockup: the mark plus the wordmark.
 *
 * This exists because the app was introducing itself four different ways — a
 * stock Material `SecurityIcon` shield on the landing and auth pages, a
 * typographic letter K in the recruiter sidebar, this mark on /jobs and the
 * error surfaces, and a fifth red shield in an admin header that was never
 * wired up. The wordmark could not agree on case either, splitting 27 KIRMYA
 * to 2 Kirmya.
 *
 * Every surface that shows the brand should render this. Nothing else should
 * hand-assemble a mark and a wordmark.
 */

/** Change this once to change the wordmark everywhere. */
const WORDMARK = 'Kirmya';

export default function BrandLockup({
  size = 40,
  variant = 'h5',
  suffix,
  sx,
}: {
  /** Edge length of the mark in px. */
  size?: number;
  /** Typography variant for the wordmark. */
  variant?: 'h4' | 'h5' | 'h6' | 'subtitle1';
  /** Optional second line, e.g. a suite or section label. */
  suffix?: React.ReactNode;
  sx?: SxProps<Theme>;
}) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center" sx={sx}>
      <BrandMark size={size} />
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant={variant}
          component="span"
          sx={{ display: 'block', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}
        >
          {WORDMARK}
        </Typography>
        {suffix}
      </Box>
    </Stack>
  );
}

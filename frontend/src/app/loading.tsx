import React from 'react';
import { Box, Container, Skeleton, Stack, Grid } from '@mui/material';

/**
 * Root route-transition fallback. Deliberately a skeleton rather than a centred
 * spinner: it holds the shape of the page being loaded, so content does not jump
 * when it resolves.
 */
export default function Loading() {
  return (
    <Box
      sx={{ bgcolor: 'background.default', minHeight: '100dvh' }}
      role="status"
      aria-busy="true"
      aria-label="Loading page"
    >
      {/* nav strip */}
      <Box
        sx={{
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: { xs: 2, md: 4 },
          py: 1.75,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Skeleton variant="rounded" width={38} height={38} sx={{ borderRadius: '10px' }} />
          <Skeleton variant="text" width={104} height={26} />
          <Box sx={{ flexGrow: 1 }} />
          <Stack direction="row" spacing={2.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {[64, 52, 78, 60].map((w, i) => (
              <Skeleton key={i} variant="text" width={w} height={20} />
            ))}
          </Stack>
          <Skeleton variant="rounded" width={92} height={38} sx={{ borderRadius: '10px' }} />
        </Stack>
      </Box>

      <Container maxWidth="xl" sx={{ py: { xs: 5, md: 8 } }}>
        {/* page heading */}
        <Skeleton variant="text" width="42%" height={54} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="62%" height={26} sx={{ mb: 5 }} />

        {/* content cards */}
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton
                variant="rounded"
                height={188}
                sx={{ borderRadius: '16px' }}
              />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

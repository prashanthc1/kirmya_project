'use client';

import React from 'react';
import { Box, Typography, Grid, Paper, Stack, Chip, useTheme } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import GlassCard from '../landing/GlassCard';

interface OfficeLocationsProps {
  locations: any[];
}

export const OfficeLocations: React.FC<OfficeLocationsProps> = ({ locations }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <GlassCard sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <LocationOnIcon sx={{ color: '#ec4899', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          Global Office Locations &amp; Facilities
        </Typography>
      </Stack>

      <Grid container spacing={2.5}>
        {locations.map((loc) => (
          <Grid item xs={12} md={4} key={loc.id}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                height: '100%',
              }}
            >
              <Chip label={loc.type} size="small" color="primary" sx={{ fontWeight: 800, mb: 1.5 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
                {loc.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {loc.address}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main', display: 'block' }}>
                {loc.city}, {loc.country}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </GlassCard>
  );
};

export default OfficeLocations;

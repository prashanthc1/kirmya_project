'use client';

import React, { useState } from 'react';
import { Box, Typography, Stack, Paper, Chip, useTheme } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import GlassCard from '../landing/GlassCard';

interface MapLocation {
  id: string;
  name: string;
  type: 'Headquarters' | 'Regional Office' | 'Tech Hub';
  city: string;
  country: string;
  coords: { lat: number; lng: number };
  openJobs: number;
}

const mockLocations: MapLocation[] = [
  { id: 'l1', name: 'Emaar Group HQ', type: 'Headquarters', city: 'Dubai', country: 'United Arab Emirates', coords: { lat: 25.1972, lng: 55.2744 }, openJobs: 18 },
  { id: 'l2', name: 'Google MENA Tech Hub', type: 'Regional Office', city: 'Dubai Internet City', country: 'United Arab Emirates', coords: { lat: 25.0945, lng: 55.1558 }, openJobs: 24 },
  { id: 'l3', name: 'Microsoft Enterprise Center', type: 'Regional Office', city: 'Abu Dhabi', country: 'United Arab Emirates', coords: { lat: 24.4539, lng: 54.3773 }, openJobs: 15 },
  { id: 'l4', name: 'ADNOC Petroleum Tower', type: 'Headquarters', city: 'Abu Dhabi', country: 'United Arab Emirates', coords: { lat: 24.4667, lng: 54.3667 }, openJobs: 31 },
];

export const MapView: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [selectedLoc, setSelectedLoc] = useState<MapLocation>(mockLocations[0]);

  return (
    <GlassCard sx={{ p: { xs: 3, md: 4 }, mb: 6 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <MapIcon sx={{ color: 'primary.main', fontSize: 32 }} />
        <Typography variant="h5" sx={{ fontWeight: 900, color: 'text.primary' }}>
          Interactive Employer Map View
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Explore employer headquarters, innovation hubs, and regional offices across the region.
      </Typography>

      <Paper
        elevation={0}
        sx={{
          height: 380,
          borderRadius: '20px',
          bgcolor: isDark ? '#0f172a' : '#f1f5f9',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
        }}
      >
        {/* Visual Map Representation Canvas */}
        <Box
          sx={{
            flexGrow: 1,
            background: isDark
              ? 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)'
              : 'radial-gradient(circle at 50% 50%, #e2e8f0 0%, #cbd5e1 100%)',
            position: 'relative',
            p: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {mockLocations.map((loc) => {
            const isSel = loc.id === selectedLoc.id;
            return (
              <Box
                key={loc.id}
                onClick={() => setSelectedLoc(loc)}
                sx={{
                  position: 'relative',
                  mx: 2,
                  my: 1,
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'transform 0.2s ease',
                  transform: isSel ? 'scale(1.15)' : 'scale(1)',
                }}
              >
                <LocationOnIcon sx={{ color: isSel ? '#ec4899' : '#6366f1', fontSize: isSel ? 44 : 32 }} />
                <Chip
                  label={loc.city}
                  size="small"
                  color={isSel ? 'secondary' : 'default'}
                  sx={{ fontSize: '0.65rem', fontWeight: 800 }}
                />
              </Box>
            );
          })}
        </Box>

        {/* Selected Location Information Sidebar */}
        <Box
          sx={{
            width: { xs: '100%', md: 320 },
            p: 3,
            bgcolor: isDark ? 'rgba(30, 41, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Chip label={selectedLoc.type} size="small" color="primary" sx={{ width: 'fit-content', mb: 1, fontWeight: 800 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
            {selectedLoc.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedLoc.city}, {selectedLoc.country}
          </Typography>

          <Stack spacing={1}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#10b981' }}>
              • {selectedLoc.openJobs} Open Opportunities
            </Typography>
            <Typography variant="caption" color="text.secondary">
              • Coordinates: {selectedLoc.coords.lat.toFixed(2)} N, {selectedLoc.coords.lng.toFixed(2)} E
            </Typography>
          </Stack>
        </Box>
      </Paper>
    </GlassCard>
  );
};

export default MapView;

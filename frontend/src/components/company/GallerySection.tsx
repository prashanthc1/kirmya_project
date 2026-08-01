'use client';

import React from 'react';
import { Box, Typography, Grid, Paper, Chip, Stack, useTheme } from '@mui/material';
import CollectionsIcon from '@mui/icons-material/Collections';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GlassCard from '../landing/GlassCard';

interface GallerySectionProps {
  gallery: any[];
}

export const GallerySection: React.FC<GallerySectionProps> = ({ gallery }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <GlassCard sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <CollectionsIcon sx={{ color: '#f59e0b', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          Media Gallery &amp; Workplace Showcase
        </Typography>
      </Stack>

      <Grid container spacing={2.5}>
        {gallery.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.id}>
            <Paper
              elevation={0}
              sx={{
                height: 180,
                borderRadius: '16px',
                background: item.mediaUrl
                  ? `url(${item.mediaUrl}) center/cover no-repeat`
                  : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #ec4899 100%)',
                position: 'relative',
                overflow: 'hidden',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
              }}
            >
              <Chip
                label={item.category.toUpperCase()}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  bgcolor: 'rgba(0, 0, 0, 0.5)',
                  backdropFilter: 'blur(8px)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.65rem',
                }}
              />
              <Typography variant="subtitle2" sx={{ color: '#ffffff', fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                {item.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </GlassCard>
  );
};

export default GallerySection;

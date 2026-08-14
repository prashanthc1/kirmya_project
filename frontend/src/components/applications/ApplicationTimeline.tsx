'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { ApplicationTimelineItem } from '@/features/applications/types';

export function ApplicationTimeline({ items = [] }: { items?: ApplicationTimelineItem[] }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Application Timeline</Typography>
      {items.map(item => (
        <Box key={item.id} sx={{ mb: 2, p: 2, borderLeft: '2px solid', borderColor: 'primary.main' }}>
          <Typography variant="subtitle1">{item.title}</Typography>
          <Typography variant="body2">{item.description}</Typography>
          <Typography variant="caption" color="text.secondary">{new Date(item.date).toLocaleDateString()}</Typography>
        </Box>
      ))}
    </Box>
  );
}

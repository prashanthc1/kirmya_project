'use client';

import React from 'react';
import { Card, Typography, Stack, Chip } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';

export const ProfileLanguages: React.FC<{ languages?: any[] }> = ({ languages = [] }) => {
  return (
    <Card sx={{ borderRadius: '24px', p: 3, mb: 3, bgcolor: 'background.paper' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <LanguageIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          Languages
        </Typography>
      </Stack>

      {languages.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No languages added yet.
        </Typography>
      ) : (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
          {languages.map((l, idx) => (
            <Chip
              key={l.id || idx}
              label={`${l.name} • ${l.proficiency}`}
              variant="outlined"
              sx={{ fontWeight: 700, borderRadius: '10px' }}
            />
          ))}
        </Stack>
      )}
    </Card>
  );
};

export default ProfileLanguages;

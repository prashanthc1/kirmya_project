'use client';

import React from 'react';
import { Card, Typography, Stack, Chip, Box } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';

export const ProfileSkills: React.FC<{ skills?: any[] }> = ({ skills = [] }) => {
  return (
    <Card sx={{ borderRadius: '24px', p: 3, mb: 3, bgcolor: 'background.paper' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <BuildIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          Top Skills & Competencies
        </Typography>
      </Stack>

      {skills.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No skills listed yet.
        </Typography>
      ) : (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ gap: 1 }}>
          {skills.map((s, idx) => (
            <Chip
              key={s.id || idx}
              label={`${s.name} ${s.proficiencyLevel ? `• ${s.proficiencyLevel}` : ''}`}
              variant="outlined"
              color="primary"
              sx={{ fontWeight: 800, borderRadius: '10px' }}
            />
          ))}
        </Stack>
      )}
    </Card>
  );
};

export default ProfileSkills;

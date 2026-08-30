'use client';

import React from 'react';
import { Card, Typography, Stack, Chip, Box } from '@mui/material';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import { UserSkill } from '../../features/profile/types';
import { tokens } from '../../theme/tokens';

export const ProfileSkills: React.FC<{ skills?: UserSkill[]; isOwner?: boolean }> = ({
  skills = [],
  isOwner = false,
}) => {
  if (skills.length === 0 && !isOwner) {
    return null;
  }

  return (
    <Card
      elevation={1}
      sx={{
        borderRadius: `${tokens.radius.lg}px`,
        p: { xs: 2.5, sm: 3.5 },
        mb: 3,
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
        <BuildOutlinedIcon color="primary" sx={{ fontSize: 22 }} />
        <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
          Skills & Competencies
        </Typography>
      </Stack>

      {skills.length === 0 ? (
        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
          No skills added yet.
        </Typography>
      ) : (
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ rowGap: 1 }}>
          {skills.map((s, idx) => (
            <Chip
              key={s.id || idx}
              label={s.proficiencyLevel ? `${s.name} • ${s.proficiencyLevel}` : s.name}
              variant="outlined"
              color="primary"
              sx={{ fontWeight: 600, borderRadius: `${tokens.radius.md}px` }}
            />
          ))}
        </Stack>
      )}
    </Card>
  );
};

export default ProfileSkills;

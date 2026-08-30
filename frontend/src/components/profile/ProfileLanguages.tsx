'use client';

import React from 'react';
import { Card, Typography, Stack, Chip } from '@mui/material';
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined';
import { UserLanguage } from '../../features/profile/types';
import { tokens } from '../../theme/tokens';

export const ProfileLanguages: React.FC<{ languages?: UserLanguage[]; isOwner?: boolean }> = ({
  languages = [],
  isOwner = false,
}) => {
  if (languages.length === 0 && !isOwner) {
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
        <LanguageOutlinedIcon color="primary" sx={{ fontSize: 22 }} />
        <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
          Languages
        </Typography>
      </Stack>

      {languages.length === 0 ? (
        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
          No languages added yet.
        </Typography>
      ) : (
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ rowGap: 1 }}>
          {languages.map((l, idx) => (
            <Chip
              key={l.id || idx}
              label={l.proficiency ? `${l.name} • ${l.proficiency}` : l.name}
              variant="outlined"
              sx={{ fontWeight: 600, borderRadius: `${tokens.radius.md}px` }}
            />
          ))}
        </Stack>
      )}
    </Card>
  );
};

export default ProfileLanguages;

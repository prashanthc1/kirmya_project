'use client';

import React from 'react';
import { Card, Typography, Box, Stack, Divider } from '@mui/material';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import { UserAchievement } from '../../features/profile/types';
import { tokens } from '../../theme/tokens';

export const ProfileAchievements: React.FC<{ achievements?: UserAchievement[]; isOwner?: boolean }> = ({
  achievements = [],
  isOwner = false,
}) => {
  if (achievements.length === 0 && !isOwner) {
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
        <EmojiEventsOutlinedIcon color="primary" sx={{ fontSize: 22 }} />
        <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
          Honors & Achievements
        </Typography>
      </Stack>

      {achievements.length === 0 ? (
        <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
          No honors or achievements added yet.
        </Typography>
      ) : (
        <Stack spacing={2} divider={<Divider />}>
          {achievements.map((a, idx) => (
            <Box key={a.id || idx}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {a.title}
              </Typography>
              {a.issuer && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  {a.issuer} {a.date ? `• ${a.date}` : ''}
                </Typography>
              )}
              {a.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
                  {a.description}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      )}
    </Card>
  );
};

export default ProfileAchievements;

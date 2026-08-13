'use client';

import React from 'react';
import { Card, Typography, Box, Stack, Divider } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

export const ProfileAchievements: React.FC<{ achievements?: any[] }> = ({ achievements = [] }) => {
  return (
    <Card sx={{ borderRadius: '24px', p: 3, mb: 3, bgcolor: 'background.paper' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <EmojiEventsIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          Honors & Achievements
        </Typography>
      </Stack>

      {achievements.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No achievements listed yet.
        </Typography>
      ) : (
        <Stack spacing={2} divider={<Divider />}>
          {achievements.map((a, idx) => (
            <Box key={a.id || idx}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {a.title}
              </Typography>
              {a.description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
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

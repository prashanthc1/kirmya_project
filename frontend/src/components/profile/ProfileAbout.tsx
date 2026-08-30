'use client';

import React from 'react';
import { Card, Typography, Box } from '@mui/material';
import { tokens } from '../../theme/tokens';

export const ProfileAbout: React.FC<{ summary?: string; isOwner?: boolean }> = ({
  summary,
  isOwner = false,
}) => {
  if (!summary && !isOwner) {
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
      <Typography variant="h6" component="h2" sx={{ fontWeight: 700, mb: 1.5 }}>
        About & Career Summary
      </Typography>
      <Typography
        variant="body1"
        color={summary ? 'text.secondary' : 'text.disabled'}
        sx={{
          whiteSpace: 'pre-line',
          lineHeight: 1.7,
          fontStyle: summary ? 'normal' : 'italic',
        }}
      >
        {summary || 'No professional summary provided yet. Add a summary to introduce yourself to employers and peers.'}
      </Typography>
    </Card>
  );
};

export default ProfileAbout;

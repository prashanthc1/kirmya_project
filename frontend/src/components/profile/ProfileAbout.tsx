'use client';

import React from 'react';
import { Card, Typography, Box } from '@mui/material';

export const ProfileAbout: React.FC<{ summary?: string }> = ({ summary }) => {
  return (
    <Card sx={{ borderRadius: '24px', p: 3, mb: 3, bgcolor: 'background.paper' }}>
      <Typography variant="h6" sx={{ fontWeight: 900, mb: 1.5 }}>
        About & Professional Summary
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
        {summary || 'No professional summary provided yet.'}
      </Typography>
    </Card>
  );
};

export default ProfileAbout;

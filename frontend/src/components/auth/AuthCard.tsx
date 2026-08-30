'use client';

import React from 'react';
import { Card, CardContent } from '@mui/material';
import { tokens } from '../../theme/tokens';

interface AuthCardProps {
  children: React.ReactNode;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children }) => {
  return (
    <Card
      elevation={1}
      sx={{
        width: '100%',
        maxWidth: 480,
        mx: 'auto',
        borderRadius: `${tokens.radius.lg}px`,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: (theme) =>
          theme.palette.mode === 'dark'
            ? '0 12px 36px -4px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06)'
            : '0 12px 36px -4px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04)',
      }}
    >
      <CardContent sx={{ p: { xs: 3, sm: 4.5 } }}>{children}</CardContent>
    </Card>
  );
};

export default AuthCard;

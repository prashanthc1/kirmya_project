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
      elevation={0}
      sx={{
        width: '100%',
        maxWidth: 480,
        mx: 'auto',
        borderRadius: `${tokens.radius.lg}px`,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        boxShadow: 'none',
      }}
    >
      <CardContent sx={{ p: { xs: 3, sm: 4.5 } }}>{children}</CardContent>
    </Card>
  );
};

export default AuthCard;

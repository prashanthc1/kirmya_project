'use client';

import React from 'react';
import { Card, CardProps } from '@mui/material';

export const GlassCard: React.FC<CardProps> = ({ children, sx, ...props }) => (
  <Card
    elevation={0}
    sx={[
      {
        p: { xs: 2.5, sm: 3.5 },
        borderRadius: '20px',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
      },
      ...(Array.isArray(sx) ? sx : [sx]),
    ]}
    {...props}
  >
    {children}
  </Card>
);

export default GlassCard;

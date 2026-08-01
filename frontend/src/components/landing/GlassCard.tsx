'use client';

import React from 'react';
import { Card, CardProps, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

interface GlassCardProps extends CardProps {
  children: React.ReactNode;
  glowColor?: string;
  hoverScale?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  glowColor = 'rgba(99, 102, 241, 0.25)',
  hoverScale = 1.02,
  sx,
  ...props
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <motion.div whileHover={{ y: -4, scale: hoverScale }} transition={{ duration: 0.2, ease: 'easeOut' }}>
      <Card
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: '20px',
          bgcolor: isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(99, 102, 241, 0.12)',
          boxShadow: isDark
            ? '0 10px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
            : '0 10px 30px rgba(99, 102, 241, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.3)',
            boxShadow: `0 16px 40px ${glowColor}`,
          },
          ...sx,
        }}
        {...props}
      >
        {children}
      </Card>
    </motion.div>
  );
};

export default GlassCard;

'use client';

/**
 * The glass surface every company back-office section sits on.
 *
 * The existing `GlassCard` in the landing components is tuned for marketing
 * panels; this is the same Kirmya treatment at the density the dashboard needs,
 * and keeping it in one place means a theme change lands everywhere at once
 * rather than in fourteen copies of the same `sx` block.
 */
import React from 'react';
import { Box, SxProps, Theme, Typography, useTheme } from '@mui/material';

interface GlassPanelProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  component?: React.ElementType;
  sx?: SxProps<Theme>;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  title,
  description,
  action,
  component = 'section',
  sx,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      component={component}
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: '20px',
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.12)',
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(16px)',
        ...sx,
      }}
    >
      {(title || action) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
            mb: description ? 0.5 : 2,
          }}
        >
          {title && (
            <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
          )}
          {action}
        </Box>
      )}
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}
      {children}
    </Box>
  );
};

export default GlassPanel;

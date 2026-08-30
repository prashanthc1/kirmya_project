'use client';

import React from 'react';
import { Box, SxProps, Theme } from '@mui/material';
import { layoutWidths } from '../../theme/spacing';

export interface AppContainerProps {
  children: React.ReactNode;
  maxWidth?: 'narrow' | 'standard' | 'wide' | 'max' | false;
  disableGutters?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * Standardized Application Page Container (Prompt 14/50)
 * 
 * Enforces predictable content boundaries, horizontal padding,
 * and responsive rhythm across all platform views.
 */
export const AppContainer: React.FC<AppContainerProps> = ({
  children,
  maxWidth = 'standard',
  disableGutters = false,
  sx,
}) => {
  const getMaxWidthValue = () => {
    if (maxWidth === false) return '100%';
    switch (maxWidth) {
      case 'narrow':
        return `${layoutWidths.narrow}px`;
      case 'wide':
        return `${layoutWidths.wide}px`;
      case 'max':
        return `${layoutWidths.max}px`;
      case 'standard':
      default:
        return `${layoutWidths.standard}px`;
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: getMaxWidthValue(),
        mx: 'auto',
        px: disableGutters ? 0 : { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, sm: 3, md: 4 },
        boxSizing: 'border-box',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
};

export default AppContainer;

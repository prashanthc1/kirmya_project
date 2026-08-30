'use client';

import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  compact = false,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: compact ? 3 : 6,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        border: (theme) => `1px dashed ${theme.palette.divider}`,
        borderRadius: 2,
      }}
      role="region"
      aria-label={title}
    >
      <Box
        sx={{
          color: 'text.secondary',
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '& > svg': {
            fontSize: compact ? 40 : 56,
            opacity: 0.6,
          },
        }}
      >
        {icon || <InboxOutlinedIcon />}
      </Box>

      <Typography variant={compact ? 'h6' : 'h5'} component="h3" fontWeight={600} gutterBottom>
        {title}
      </Typography>

      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 460, mb: actionLabel || secondaryActionLabel ? 3 : 0 }}
        >
          {description}
        </Typography>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outlined" color="primary" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
          {actionLabel && onAction && (
            <Button variant="contained" color="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default EmptyState;

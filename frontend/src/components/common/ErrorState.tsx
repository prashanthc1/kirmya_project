'use client';

import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  errorCode?: string;
  onRetry?: () => void;
  actionLabel?: string;
  compact?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'We encountered an error while loading this content. Please try again.',
  errorCode,
  onRetry,
  actionLabel = 'Retry',
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
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.06)' : 'rgba(254, 242, 242, 0.8)',
        border: (theme) => `1px solid ${theme.palette.error.light}`,
        borderRadius: 2,
      }}
      role="alert"
    >
      <Box
        sx={{
          color: 'error.main',
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '& > svg': {
            fontSize: compact ? 40 : 56,
          },
        }}
      >
        <ErrorOutlineOutlinedIcon />
      </Box>

      <Typography variant={compact ? 'h6' : 'h5'} component="h3" fontWeight={600} gutterBottom>
        {title}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 460, mb: onRetry ? 3 : 0 }}
      >
        {message}
      </Typography>

      {errorCode && (
        <Typography
          variant="caption"
          sx={{
            fontFamily: 'monospace',
            backgroundColor: 'action.hover',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            mb: onRetry ? 2 : 0,
          }}
        >
          Code: {errorCode}
        </Typography>
      )}

      {onRetry && (
        <Button
          variant="outlined"
          color="error"
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          sx={{ mt: 1 }}
        >
          {actionLabel}
        </Button>
      )}
    </Paper>
  );
};

export default ErrorState;

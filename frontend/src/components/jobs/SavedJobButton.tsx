'use client';

import React, { useState } from 'react';
import { IconButton, Tooltip, CircularProgress, Box, Typography } from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { useRouter } from 'next/navigation';

import { useAuth } from '../../hooks/useAuth';
import { jobsApi } from '../../features/jobs/api';
import { ROUTES } from '../../shared/routes';

export interface SavedJobButtonProps {
  jobId: string;
  jobTitle?: string;
  initialSaved?: boolean;
  onToggle?: (isSaved: boolean) => void;
  size?: 'small' | 'medium';
}

export const SavedJobButton: React.FC<SavedJobButtonProps> = ({
  jobId,
  jobTitle = 'this role',
  initialSaved = false,
  onToggle,
  size = 'small',
}) => {
  const router = useRouter();
  const { authenticated } = useAuth();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!authenticated) {
      router.push(ROUTES.AUTH.LOGIN);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    const nextSaved = !saved;
    setSaved(nextSaved);

    try {
      if (nextSaved) {
        await jobsApi.saveJob(jobId);
      } else {
        await jobsApi.unsaveJob(jobId);
      }
      onToggle?.(nextSaved);
    } catch (err: any) {
      setSaved(!nextSaved);
      setErrorMessage(
        err?.response?.data?.error ||
          err?.message ||
          (nextSaved
            ? 'Could not save this job. Please try again.'
            : 'Could not remove this saved job. Please try again.'),
      );
    } finally {
      setLoading(false);
    }
  };

  const label = saved ? `Unsave ${jobTitle}` : `Save ${jobTitle}`;

  return (
    <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <Tooltip title={errorMessage || label}>
        <span>
          <IconButton
            onClick={handleToggle}
            disabled={loading}
            size={size}
            aria-label={label}
            aria-pressed={saved}
            sx={{
              color: saved ? 'primary.main' : 'text.secondary',
              '&:hover': {
                color: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
          >
            {loading ? (
              <CircularProgress size={size === 'small' ? 18 : 22} color="inherit" />
            ) : saved ? (
              <BookmarkIcon fontSize={size} />
            ) : (
              <BookmarkBorderIcon fontSize={size} />
            )}
          </IconButton>
        </span>
      </Tooltip>
      {errorMessage && (
        <Typography
          component="span"
          variant="caption"
          color="error"
          role="alert"
          sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}
        >
          {errorMessage}
        </Typography>
      )}
    </Box>
  );
};

export default SavedJobButton;

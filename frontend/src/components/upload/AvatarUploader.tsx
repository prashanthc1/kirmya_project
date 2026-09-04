'use client';

import React, { useRef, ChangeEvent } from 'react';
import {
  Box,
  Avatar,
  IconButton,
  CircularProgress,
  Tooltip,
  Typography,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { FileRecord } from '../../features/media/types';
import { useFileUpload } from '../../hooks/useFileUpload';

export interface AvatarUploaderProps {
  currentAvatarUrl?: string;
  name?: string;
  size?: number;
  onAvatarUpdated?: (file: FileRecord) => void;
  onAvatarDeleted?: () => void;
  disabled?: boolean;
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  currentAvatarUrl,
  name = 'User',
  size = 100,
  onAvatarUpdated,
  onAvatarDeleted,
  disabled = false,
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { upload, uploading, progress, error, uploadedFile, reset } = useFileUpload({
    category: 'avatar',
    visibility: 'public',
    maxSizeBytes: 5 * 1024 * 1024,
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    onSuccess: (file) => {
      onAvatarUpdated?.(file);
    },
  });

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      upload(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    reset();
    if (fileInputRef.current) fileInputRef.current.value = '';
    onAvatarDeleted?.();
  };

  const displayUrl = uploadedFile?.url || currentAvatarUrl;

  return (
    <Stack spacing={1} alignItems="center">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        disabled={disabled || uploading}
        aria-label="Upload profile avatar"
      />

      <Box
        sx={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: '50%',
          p: '3px',
          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${alpha(
            theme.palette.primary.light,
            0.6
          )})`,
        }}
      >
        <Avatar
          src={displayUrl}
          alt={name}
          sx={{
            width: '100%',
            height: '100%',
            fontSize: size * 0.35,
            fontWeight: 700,
            border: `2px solid ${theme.palette.background.paper}`,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
          }}
        >
          {name.charAt(0).toUpperCase()}
        </Avatar>

        {uploading ? (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: alpha(theme.palette.common.black, 0.6),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}
          >
            <CircularProgress
              variant="determinate"
              value={progress}
              size={size * 0.5}
              thickness={4}
              sx={{ color: theme.palette.common.white }}
            />
          </Box>
        ) : (
          <Tooltip title={disabled ? '' : 'Change Avatar'}>
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              sx={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 32,
                height: 32,
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.primary.contrastText,
                border: `2px solid ${theme.palette.background.paper}`,
                boxShadow: theme.shadows[2],
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
              aria-label="Upload avatar image"
            >
              <PhotoCameraRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {displayUrl && !uploading && onAvatarDeleted ? (
        <IconButton
          size="small"
          onClick={handleRemove}
          color="error"
          sx={{ fontSize: 12 }}
          aria-label="Remove avatar image"
        >
          <DeleteOutlineRoundedIcon fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="caption" color="error">
            Remove
          </Typography>
        </IconButton>
      ) : null}

      {error ? (
        <Typography variant="caption" color="error" textAlign="center">
          {error}
        </Typography>
      ) : null}
    </Stack>
  );
};

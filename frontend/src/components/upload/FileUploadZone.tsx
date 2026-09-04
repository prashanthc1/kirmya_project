'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Button,
  Alert,
  Paper,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import CloudUploadRoundedIcon from '@mui/icons-material/CloudUploadRounded';
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { FileCategory, FileRecord, FileVisibility } from '../../features/media/types';
import { useFileUpload } from '../../hooks/useFileUpload';

export interface FileUploadZoneProps {
  category?: FileCategory;
  visibility?: FileVisibility;
  maxSizeBytes?: number;
  allowedExtensions?: string[];
  label?: string;
  helperText?: string;
  onFileUploaded?: (file: FileRecord) => void;
  onFileRemoved?: () => void;
  disabled?: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  category = 'general',
  visibility = 'private',
  maxSizeBytes = 10 * 1024 * 1024, // 10MB default
  allowedExtensions = ['.pdf', '.docx', '.jpg', '.png'],
  label = 'Upload File',
  helperText = 'Drag and drop your file here, or browse',
  onFileUploaded,
  onFileRemoved,
  disabled = false,
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [currentFileSize, setCurrentFileSize] = useState<number | null>(null);

  const { upload, uploading, progress, error, uploadedFile, reset } = useFileUpload({
    category,
    visibility,
    maxSizeBytes,
    allowedExtensions,
    onSuccess: (file) => {
      onFileUploaded?.(file);
    },
  });

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const processFile = (file: File) => {
    setCurrentFileName(file.name);
    setCurrentFileSize(file.size);
    upload(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled || uploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    reset();
    setCurrentFileName(null);
    setCurrentFileSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileRemoved?.();
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const acceptString = allowedExtensions.join(',');

  return (
    <Box sx={{ width: '100%' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept={acceptString}
        style={{ display: 'none' }}
        disabled={disabled || uploading}
        aria-label={label}
      />

      {!uploadedFile && !uploading ? (
        <Paper
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          elevation={0}
          sx={{
            p: 4,
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            borderRadius: 3,
            border: '2px dashed',
            borderColor: isDragOver
              ? theme.palette.primary.main
              : alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.3 : 0.8),
            backgroundColor: isDragOver
              ? alpha(theme.palette.primary.main, 0.08)
              : alpha(theme.palette.background.paper, 0.6),
            backdropFilter: 'blur(12px)',
            transition: 'all 0.25s ease',
            opacity: disabled ? 0.6 : 1,
            '&:hover': {
              borderColor: disabled ? undefined : theme.palette.primary.main,
              backgroundColor: disabled ? undefined : alpha(theme.palette.primary.main, 0.04),
              transform: disabled ? 'none' : 'translateY(-2px)',
            },
          }}
        >
          <Stack spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            >
              <CloudUploadRoundedIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h6" fontWeight={600}>
              {label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {helperText}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              Supported: {allowedExtensions.join(', ')} • Max size: {formatBytes(maxSizeBytes)}
            </Typography>
          </Stack>
        </Paper>
      ) : null}

      {uploading ? (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: alpha(theme.palette.primary.main, 0.3),
            backgroundColor: alpha(theme.palette.background.paper, 0.7),
            backdropFilter: 'blur(12px)',
          }}
        >
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <InsertDriveFileRoundedIcon color="primary" sx={{ fontSize: 32 }} />
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap fontWeight={600}>
                  {currentFileName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {currentFileSize ? formatBytes(currentFileSize) : ''} • Uploading {progress}%
                </Typography>
              </Box>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: alpha(theme.palette.primary.main, 0.15),
              }}
            />
          </Stack>
        </Paper>
      ) : null}

      {uploadedFile ? (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: '1px solid',
            borderColor: alpha(theme.palette.success.main, 0.4),
            backgroundColor: alpha(theme.palette.success.main, 0.05),
            backdropFilter: 'blur(12px)',
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
              <CheckCircleRoundedIcon color="success" sx={{ fontSize: 28 }} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" noWrap fontWeight={600}>
                  {uploadedFile.original_filename}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatBytes(uploadedFile.file_size)} • Uploaded successfully
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1}>
              <IconButton
                size="small"
                onClick={handleRemove}
                color="error"
                aria-label="Remove file"
                title="Remove file"
              >
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </Paper>
      ) : null}

      {error ? (
        <Alert
          severity="error"
          sx={{ mt: 2, borderRadius: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshRoundedIcon />}
              onClick={() => {
                reset();
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : null}
    </Box>
  );
};

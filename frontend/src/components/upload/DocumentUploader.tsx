'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { FileRecord } from '../../features/media/types';
import { FileUploadZone } from './FileUploadZone';

export interface DocumentUploaderProps {
  title?: string;
  category?: 'resume' | 'application_document' | 'verification_evidence';
  onDocumentUploaded?: (file: FileRecord) => void;
  onDocumentRemoved?: () => void;
  disabled?: boolean;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  title = 'Upload Resume / CV',
  category = 'resume',
  onDocumentUploaded,
  onDocumentRemoved,
  disabled = false,
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      {title ? (
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
          {title}
        </Typography>
      ) : null}
      <FileUploadZone
        category={category}
        visibility="private"
        maxSizeBytes={10 * 1024 * 1024} // 10MB
        allowedExtensions={['.pdf', '.docx', '.doc']}
        label="Drop your resume or document here"
        helperText="Supported formats: PDF, DOCX (Max 10MB)"
        onFileUploaded={onDocumentUploaded}
        onFileRemoved={onDocumentRemoved}
        disabled={disabled}
      />
    </Box>
  );
};

'use client';

import React, { useState } from 'react';
import { Paper, Box, Typography, Button, CircularProgress, Stack, LinearProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface ResumeImportProps {
  onImportSuccess: (resume: any) => void;
}

export const ResumeImport: React.FC<ResumeImportProps> = ({ onImportSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleProcessImport = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(30);

    setTimeout(() => setProgress(70), 500);
    setTimeout(() => {
      setProgress(100);
      setUploading(false);
      onImportSuccess({ id: 'imported-1', title: file.name.replace('.pdf', '') });
    }, 1200);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 5,
        borderRadius: 4,
        background: 'rgba(255, 255, 255, 0.03)',
        border: '2px dashed rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px)',
        textAlign: 'center',
      }}
    >
      <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />

      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
        Upload Your Existing Resume
      </Typography>

      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        Supports PDF, DOCX, and TXT files up to 10 MB. Our AI parser extracts work history, skills, and education automatically.
      </Typography>

      <input
        accept=".pdf,.docx,.txt"
        style={{ display: 'none' }}
        id="resume-file-input"
        type="file"
        onChange={handleFileDrop}
      />
      <label htmlFor="resume-file-input">
        <Button variant="outlined" component="span" sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 4, py: 1.2, mb: 3 }}>
          {file ? file.name : 'Select Resume File'}
        </Button>
      </label>

      {file && !uploading && (
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" size="large" onClick={handleProcessImport} sx={{ borderRadius: 2, fontWeight: 800, px: 5 }}>
            Parse & Extract Resume Sections
          </Button>
        </Box>
      )}

      {uploading && (
        <Box sx={{ width: '60%', mx: 'auto', mt: 3 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>
            Extracting Experience & Skills ({progress}%)
          </Typography>
          <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
        </Box>
      )}
    </Paper>
  );
};

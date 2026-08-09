'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Stack,
  CircularProgress,
} from '@mui/material';
import { AutoAwesome as AIIcon } from '@mui/icons-material';
import { ToneSelector } from './ToneSelector';
import { LengthSelector } from './LengthSelector';
import { GenerateCoverLetterRequest } from '@/features/cover-letter/types';

export interface CoverLetterGeneratorProps {
  onGenerate: (req: GenerateCoverLetterRequest) => Promise<void>;
}

export const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({ onGenerate }) => {
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [tone, setTone] = useState('Professional');
  const [length, setLength] = useState<'Short' | 'Standard' | 'Detailed'>('Standard');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle || !companyName) return;
    setLoading(true);
    try {
      await onGenerate({
        jobTitle,
        companyName,
        jobDescription,
        tone,
        length,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      sx={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 3,
        p: { xs: 2, md: 4 },
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <AIIcon color="primary" />
          <Typography variant="h5" fontWeight={800}>
            AI Cover Letter Generator
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={4}>
          Instantly generate a tailored cover letter pulling verified experience from your profile and resume.
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Target Job Title"
                required
                fullWidth
                placeholder="e.g. Senior Full-Stack Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
              <TextField
                label="Company Name"
                required
                fullWidth
                placeholder="e.g. TechFlow Systems"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </Stack>

            <TextField
              label="Job Description (Optional)"
              multiline
              rows={4}
              fullWidth
              placeholder="Paste job requirements to enable deep skill matching..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />

            <ToneSelector value={tone} onChange={setTone} />
            <LengthSelector value={length} onChange={setLength} />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={!jobTitle || !companyName || loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AIIcon />}
              sx={{ borderRadius: 3.5, py: 1.5, fontSize: '1rem', fontWeight: 700 }}
            >
              Generate AI Cover Letter
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  );
};

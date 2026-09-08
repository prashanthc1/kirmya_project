'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Alert,
  Paper,
  Chip,
  LinearProgress,
  useTheme,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { motion } from 'framer-motion';
import { springs } from '../../theme/motion';
import GlassCard from '../landing/GlassCard';
import { ResumeParsedResult } from '../../features/onboarding/types';
import { onboardingApi } from '../../features/onboarding/api';

interface StepProps {
  onNext: (data?: any) => void;
  onPrev: () => void;
}

export const ResumeUploadStep: React.FC<StepProps> = ({ onNext, onPrev }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ResumeParsedResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds maximum allowed 10 MB limit.');
      return;
    }

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx')) {
      setError('Unsupported resume format. Please upload PDF or DOCX.');
      return;
    }

    setError(null);
    setLoading(true);

    // This used to answer after a 1.2 second timer with a career nobody had
    // written: seven skills, a post at "TechVentures Inc.", a degree and an AWS
    // credential number, all presented as what the uploaded file said. The file
    // now goes to the server, and what comes back is what is shown.
    const formData = new FormData();
    formData.append('resume', file);
    onboardingApi
      .uploadResume(formData)
      .then((result) => {
        setParsed(result);
        setLoading(false);
      })
      .catch(() => {
        setError('The resume could not be uploaded. Try again, or continue and fill in the details yourself.');
        setLoading(false);
      });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={springs.entrance}>
      <GlassCard sx={{ p: { xs: 3, md: 5 } }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Upload Resume / CV
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Upload your existing resume. Automatic extraction is not available yet, so the fields on the next
          steps stay yours to fill in.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        <Stack spacing={3} alignItems="center" sx={{ mb: 4 }}>
          {!parsed && !loading && (
            <Paper
              elevation={0}
              sx={{
                p: 5,
                border: '2px dashed',
                borderColor: 'primary.main',
                borderRadius: '20px',
                bgcolor: isDark ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.03)',
                textAlign: 'center',
                width: '100%',
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 54, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Drag and drop your resume file here
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Supported formats: PDF, DOCX (Max 10 MB)
              </Typography>
              <Button
                variant="contained"
                component="label"
                sx={{
                  py: 1.4,
                  px: 4,
                  borderRadius: '12px',
                  fontWeight: 800,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                }}
              >
                Browse File
                <input type="file" hidden accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} />
              </Button>
            </Paper>
          )}

          {loading && (
            <Box sx={{ width: '100%', textAlign: 'center', py: 4 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#a855f7', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <AutoAwesomeIcon /> Extracting Resume Data with AI...
              </Typography>
              <LinearProgress sx={{ borderRadius: 4, height: 8 }} />
            </Box>
          )}

          {parsed && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                width: '100%',
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <CheckCircleIcon sx={{ color: '#10b981' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  Successfully Parsed {parsed.file_name}
                </Typography>
              </Stack>

              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
                Extracted Skills ({parsed.skills.length}):
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                {parsed.skills.map((sk) => (
                  <Chip key={sk} label={sk} size="small" color="primary" variant="outlined" />
                ))}
              </Stack>
            </Paper>
          )}
        </Stack>

        <Stack direction="row" justifyContent="space-between">
          <Button variant="text" onClick={onPrev} startIcon={<ArrowBackIcon />} sx={{ fontWeight: 700 }}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={() => onNext({ resume: parsed })}
            endIcon={<ArrowForwardIcon />}
            sx={{ py: 1.2, px: 3.5, borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
          >
            Continue
          </Button>
        </Stack>
      </GlassCard>
    </motion.div>
  );
};

export default ResumeUploadStep;

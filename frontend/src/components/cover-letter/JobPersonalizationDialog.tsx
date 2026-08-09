'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Stack,
  Chip,
  Alert,
} from '@mui/material';
import { AutoAwesome as AIIcon } from '@mui/icons-material';
import { TailorJobResponse } from '@/features/cover-letter/types';

export interface JobPersonalizationDialogProps {
  open: boolean;
  onClose: () => void;
  onTailor: (jobDescription: string) => Promise<TailorJobResponse>;
}

export const JobPersonalizationDialog: React.FC<JobPersonalizationDialogProps> = ({
  open,
  onClose,
  onTailor,
}) => {
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TailorJobResponse | null>(null);

  const handleSubmit = async () => {
    if (!jobDescription.trim()) return;
    setLoading(true);
    try {
      const res = await onTailor(jobDescription);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
      <DialogTitle display="flex" alignItems="center" gap={1}>
        <AIIcon color="primary" />
        AI Job Personalization Analyzer
      </DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Paste the target job description below. Kirmya AI will analyze matching skills, score your job alignment, and generate a tailored version without overwriting your original letter.
        </Typography>

        <TextField
          multiline
          rows={6}
          fullWidth
          placeholder="Paste Job Description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          sx={{ mb: 3 }}
        />

        {loading && (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress size={32} />
          </Box>
        )}

        {result && (
          <Box sx={{ background: 'rgba(0,0,0,0.2)', p: 2.5, borderRadius: 3 }}>
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              Job Match Score: <strong>{result.matchScore}%</strong> — Tailored cover letter version created successfully.
            </Alert>

            <Typography variant="subtitle2" fontWeight={700} mb={1}>
              Matching Required Skills
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1} mb={2}>
              {result.relevantSkills.map((s, idx) => (
                <Chip key={idx} label={s} color="primary" size="small" />
              ))}
            </Stack>

            <Typography variant="subtitle2" fontWeight={700} mb={1}>
              Recommended Talking Points
            </Typography>
            <Box component="ul" pl={2} m={0}>
              {result.recommendedTalkingPoints.map((pt, idx) => (
                <Typography component="li" variant="body2" key={idx} color="text.secondary">
                  {pt}
                </Typography>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          disabled={!jobDescription.trim() || loading}
          onClick={handleSubmit}
          startIcon={loading ? <CircularProgress size={16} /> : <AIIcon />}
        >
          Analyze & Tailor Letter
        </Button>
      </DialogActions>
    </Dialog>
  );
};

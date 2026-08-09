'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Stack,
  Chip,
  CircularProgress,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { TailorJobResponse } from '@/features/resume/types';

interface JobTailoringDialogProps {
  open: boolean;
  onClose: () => void;
  onTailor: (jobDescription: string) => Promise<TailorJobResponse>;
}

export const JobTailoringDialog: React.FC<JobTailoringDialogProps> = ({ open, onClose, onTailor }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TailorJobResponse | null>(null);

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) return;
    setLoading(true);
    try {
      const res = await onTailor(jobDescription);
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoAwesomeIcon sx={{ color: '#9933FF' }} /> Tailor Resume For Specific Job Description
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Paste the target job description to compute match score, identify missing ATS keywords, and generate a new job-tailored resume version without altering your master resume.
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={6}
          placeholder="Paste full job posting text here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          sx={{ mb: 3 }}
        />

        {result && (
          <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: 'rgba(0, 102, 255, 0.05)', border: '1px solid rgba(0, 102, 255, 0.2)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Job Match Score
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#00CC66' }}>
                {result.matchScore}%
              </Typography>
            </Box>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Missing ATS Keywords:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
              {result.missingKeywords.map((kw) => (
                <Chip key={kw} label={kw} color="warning" size="small" sx={{ fontWeight: 700 }} />
              ))}
            </Stack>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Recommended Bullet Adjustments:
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0, color: 'text.secondary', fontSize: '0.85rem' }}>
              {result.recommendedChanges.map((change, i) => (
                <li key={i}>{change}</li>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleAnalyze}
          disabled={loading || !jobDescription.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesomeIcon />}
          sx={{ borderRadius: 2, fontWeight: 700 }}
        >
          {loading ? 'Analyzing...' : 'Generate Job-Tailored Resume'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

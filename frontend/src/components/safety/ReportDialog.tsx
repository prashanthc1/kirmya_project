'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Stack,
  Alert,
} from '@mui/material';

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  targetType?: string;
  targetId?: string;
  targetTitle?: string;
}

export const ReportDialog: React.FC<ReportDialogProps> = ({
  open,
  onClose,
  targetType = 'job',
  targetId = 'target-123',
  targetTitle = 'Job Position',
}) => {
  const [category, setCategory] = useState('fake_job');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { value: 'spam', label: 'Spam' },
    { value: 'scam', label: 'Scam' },
    { value: 'fraud', label: 'Financial Fraud' },
    { value: 'fake_job', label: 'Fake Job Posting' },
    { value: 'fake_recruiter', label: 'Fake Recruiter / Impersonation' },
    { value: 'harassment', label: 'Harassment or Threats' },
    { value: 'hate_abuse', label: 'Hate or Discriminatory Abuse' },
    { value: 'phishing', label: 'Phishing / Malicious Content' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setDescription('');
    }, 1200);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
      <DialogTitle sx={{ fontWeight: 900 }}>Report Content or Account</DialogTitle>
      <DialogContent>
        {submitted ? (
          <Alert severity="success" sx={{ mt: 1, borderRadius: '12px' }}>
            Report submitted successfully. Reporter details are strictly protected and confidential.
          </Alert>
        ) : (
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              select
              label="Report Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              fullWidth
            >
              {categories.map((c) => (
                <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Description & Context"
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue or evidence..."
              fullWidth
            />
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          color="error"
          disabled={!description || submitted}
          onClick={handleSubmit}
          sx={{ borderRadius: '12px', fontWeight: 800 }}
        >
          Submit Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportDialog;

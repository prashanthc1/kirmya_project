'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  Typography,
} from '@mui/material';
import { safetyApi } from '../../features/trust_safety/api';

interface ReportDialogProps {
  open: boolean;
  onClose: () => void;
  defaultTargetType?: string;
  defaultTargetId?: string;
}

export const ReportDialog: React.FC<ReportDialogProps> = ({
  open,
  onClose,
  defaultTargetType = 'job',
  defaultTargetId = 'target-001',
}) => {
  const [targetType, setTargetType] = useState(defaultTargetType);
  const [targetId, setTargetId] = useState(defaultTargetId);
  const [category, setCategory] = useState('fake_job');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!description) {
      setStatus('Please provide a description of the safety violation.');
      return;
    }
    await safetyApi.submitReport({
      target_type: targetType,
      target_id: targetId,
      category,
      description,
    });
    setStatus('Report submitted successfully. Confirmation ID generated.');
    setTimeout(() => {
      onClose();
      setStatus(null);
      setDescription('');
    }, 1500);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ style: { borderRadius: 24 } }}>
      <DialogTitle sx={{ fontWeight: 900 }}>Submit Confidential Safety Report</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Typography variant="body2" color="text.secondary">
            Reporters remain completely anonymous. Our Trust & Safety team will review your report in accordance with platform policies.
          </Typography>

          <FormControl fullWidth>
            <InputLabel>Target Entity Type</InputLabel>
            <Select value={targetType} label="Target Entity Type" onChange={(e) => setTargetType(e.target.value)}>
              <MenuItem value="job">Job Posting</MenuItem>
              <MenuItem value="user">User Profile</MenuItem>
              <MenuItem value="recruiter">Recruiter Account</MenuItem>
              <MenuItem value="company">Company</MenuItem>
              <MenuItem value="community">Community / Group</MenuItem>
              <MenuItem value="message">Message / Chat</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Report Category / Reason</InputLabel>
            <Select value={category} label="Report Category / Reason" onChange={(e) => setCategory(e.target.value)}>
              <MenuItem value="fake_job">Fake Job / Recruitment Scam</MenuItem>
              <MenuItem value="spam">Spam / Unsolicited Promotion</MenuItem>
              <MenuItem value="impersonation">Identity Impersonation</MenuItem>
              <MenuItem value="harassment">Harassment or Bullying</MenuItem>
              <MenuItem value="phishing">Phishing / Malicious Links</MenuItem>
              <MenuItem value="privacy_violation">Privacy Violation</MenuItem>
              <MenuItem value="other">Other Violation</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Detailed Description & Evidence Context"
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what occurred, including any advance fee payment requests or off-platform contacts..."
            fullWidth
          />

          {status && <Alert severity={status.includes('successfully') ? 'success' : 'error'} sx={{ borderRadius: '12px' }}>{status}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} sx={{ fontWeight: 800 }}>Cancel</Button>
        <Button variant="contained" color="error" onClick={handleSubmit} sx={{ borderRadius: '12px', fontWeight: 800 }}>
          Submit Confidential Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ReportDialog;

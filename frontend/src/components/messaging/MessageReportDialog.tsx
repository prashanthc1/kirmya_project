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
  Typography,
} from '@mui/material';

interface MessageReportDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
}

export const MessageReportDialog: React.FC<MessageReportDialogProps> = ({ open, onClose, onSubmit }) => {
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');

  const handleSubmit = () => {
    onSubmit(reason, details);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Report Conversation / Message</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Submit a confidential report to Kirmya Trust & Safety for review.
          </Typography>

          <FormControl fullWidth>
            <InputLabel>Reason for Report</InputLabel>
            <Select value={reason} label="Reason for Report" onChange={(e) => setReason(e.target.value)}>
              <MenuItem value="spam">Spam / Unsolicited Promotion</MenuItem>
              <MenuItem value="harassment">Harassment or Abuse</MenuItem>
              <MenuItem value="scam">Scam / Financial Fraud</MenuItem>
              <MenuItem value="impersonation">Impersonation</MenuItem>
              <MenuItem value="inappropriate">Inappropriate Content</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Additional Details (Optional)"
            multiline
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Describe the issue..."
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="error">Submit Report</Button>
      </DialogActions>
    </Dialog>
  );
};

export default MessageReportDialog;

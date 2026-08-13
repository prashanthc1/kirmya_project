'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
} from '@mui/material';

interface ProfileReportDialogProps {
  open: boolean;
  username: string;
  onClose: () => void;
  onSubmit: (reason: string, description: string) => void;
}

export const ProfileReportDialog: React.FC<ProfileReportDialogProps> = ({
  open,
  username,
  onClose,
  onSubmit,
}) => {
  const [reason, setReason] = useState('Spam or Harassment');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    onSubmit(reason, description);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
      <DialogTitle sx={{ fontWeight: 900 }}>Report Profile @{username}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Reports are handled confidentially by Kirmya Trust & Safety.
        </Typography>
        <TextField
          select
          fullWidth
          label="Report Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          sx={{ mb: 2 }}
        >
          <MenuItem value="Spam or Harassment">Spam or Harassment</MenuItem>
          <MenuItem value="Fake Account or Impersonation">Fake Account or Impersonation</MenuItem>
          <MenuItem value="Inappropriate Content">Inappropriate Content</MenuItem>
          <MenuItem value="Scam or Fraudulent Offer">Scam or Fraudulent Offer</MenuItem>
        </TextField>
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Additional Details (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ fontWeight: 700 }}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="warning" variant="contained" sx={{ borderRadius: '12px', fontWeight: 800 }}>
          Submit Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileReportDialog;

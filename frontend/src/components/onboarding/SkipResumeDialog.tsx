'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

interface SkipResumeDialogProps {
  open: boolean;
  onClose: () => void;
  onSkip: () => void;
  onFinishLater: () => void;
}

export const SkipResumeDialog: React.FC<SkipResumeDialogProps> = ({
  open,
  onClose,
  onSkip,
  onFinishLater,
}) => {
  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
      <DialogTitle sx={{ fontWeight: 900 }}>Skip Step or Finish Later?</DialogTitle>
      <DialogContent>
        <Typography variant="body1" color="text.secondary">
          You can skip optional steps and resume anytime from your candidate dashboard. Your entered progress is automatically saved to your account.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} sx={{ fontWeight: 700 }}>
          Cancel
        </Button>
        <Button onClick={onSkip} color="warning" sx={{ fontWeight: 800 }}>
          Skip Optional Step
        </Button>
        <Button onClick={onFinishLater} variant="contained" sx={{ borderRadius: '12px', fontWeight: 800 }}>
          Save & Finish Later
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SkipResumeDialog;

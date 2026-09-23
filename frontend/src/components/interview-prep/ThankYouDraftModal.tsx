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
  Stack,
  IconButton,
  Snackbar,
} from '@mui/material';
import { Close, ContentCopy, Check } from '@mui/icons-material';

interface ThankYouDraftModalProps {
  open: boolean;
  onClose: () => void;
  thankYouDraft: string;
}

export const ThankYouDraftModal: React.FC<ThankYouDraftModalProps> = ({ open, onClose, thankYouDraft }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(thankYouDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: '#0F172A',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          color: '#fff',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: "primary.main" }}>
          Personalized Thank-You Follow-Up Email
        </Typography>
        <IconButton onClick={onClose} sx={{ color: "text.secondary" }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Send this tailored thank-you email within 24 hours of your interview to demonstrate professionalism and reinforce interest.
        </Typography>

        <TextField
          multiline
          rows={10}
          fullWidth
          value={thankYouDraft}
          InputProps={{ readOnly: true }}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: "text.primary",
              fontFamily: 'monospace',
              bgcolor: "background.paper",
            },
          }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} sx={{ color: "text.secondary" }}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={handleCopy}
          startIcon={copied ? <Check /> : <ContentCopy />}
          sx={{
            bgcolor: copied ? '#10B981' : "primary.main",
            color: "primary.contrastText",
            fontWeight: 600,
            borderRadius: 2.5,
            px: 3,
          }}
        >
          {copied ? 'Copied to Clipboard!' : 'Copy Thank-You Email'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

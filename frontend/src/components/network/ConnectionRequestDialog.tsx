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
} from '@mui/material';

interface ConnectionRequestDialogProps {
  open: boolean;
  targetName: string;
  onClose: () => void;
  onSubmit: (note?: string) => void;
}

export const ConnectionRequestDialog: React.FC<ConnectionRequestDialogProps> = ({
  open,
  targetName,
  onClose,
  onSubmit,
}) => {
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    onSubmit(note);
    setNote('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '24px', p: 1, maxWidth: 500, width: '100%' } }}>
      <DialogTitle sx={{ fontWeight: 900 }}>
        Connect with {targetName}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Adding a personal note increases acceptance rate. Notes are optional (max 500 characters).
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={3}
          placeholder="Ex: Hi! I noticed we both work in cloud engineering in Dubai and wanted to connect..."
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
        />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}>
          {note.length}/500
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={() => onSubmit()} variant="outlined" sx={{ borderRadius: '12px', fontWeight: 700 }}>
          Send Without Note
        </Button>
        <Button onClick={handleSubmit} variant="contained" sx={{ borderRadius: '12px', fontWeight: 800 }}>
          Send Invitation
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConnectionRequestDialog;

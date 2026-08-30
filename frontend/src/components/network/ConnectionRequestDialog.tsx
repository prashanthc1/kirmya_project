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
  Stack,
} from '@mui/material';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import { tokens } from '../../theme/tokens';

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

  const handleSubmitWithNote = () => {
    onSubmit(note.trim() ? note.trim() : undefined);
    setNote('');
    onClose();
  };

  const handleSubmitWithoutNote = () => {
    onSubmit(undefined);
    setNote('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: `${tokens.radius.lg}px`,
          p: 1.5,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, letterSpacing: '-0.01em', pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <PersonAddOutlinedIcon color="primary" />
          <span>Connect with {targetName}</span>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
            You can include an optional personalized note to introduce yourself or mention shared interests.
          </Typography>

          <TextField
            label="Add a note (optional)"
            placeholder="Hi, I noticed your work in..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            rows={3}
            fullWidth
            variant="outlined"
            inputProps={{ maxLength: 300 }}
            helperText={`${note.length}/300 characters`}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Button
          onClick={handleSubmitWithoutNote}
          variant="text"
          sx={{ fontWeight: 600 }}
        >
          Send without note
        </Button>
        <Stack direction="row" spacing={1}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitWithNote}
            variant="contained"
            sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700 }}
          >
            Send Invitation
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default ConnectionRequestDialog;

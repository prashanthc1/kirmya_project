'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Stack,
  Typography,
  IconButton,
} from '@mui/material';
import { Close } from '@mui/icons-material';

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (title: string, category: string) => Promise<void>;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({ open, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setLoading(true);
    try {
      await onAdd(title, category);
      setTitle('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: '#0F172A',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#fff',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={700}>
          Add Preparation Task
        </Typography>
        <IconButton onClick={onClose} sx={{ color: '#94A3B8' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1 }}>
          <Stack spacing={2}>
            <TextField
              label="Task Title"
              required
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Prepare system architecture diagrams"
              sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#94A3B8' } }}
            />

            <TextField
              select
              label="Category"
              fullWidth
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              sx={{ '& .MuiOutlinedInput-root': { color: '#fff' }, '& .MuiInputLabel-root': { color: '#94A3B8' } }}
            >
              <MenuItem value="General">General</MenuItem>
              <MenuItem value="Research">Company Research</MenuItem>
              <MenuItem value="Technical">Technical Prep</MenuItem>
              <MenuItem value="Behavioral">Behavioral Stories</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} sx={{ color: '#94A3B8' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              background: '#3B82F6',
              color: '#fff',
              fontWeight: 600,
              borderRadius: 2.5,
              px: 2.5,
            }}
          >
            {loading ? 'Adding...' : 'Add Task'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

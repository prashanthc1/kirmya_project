'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Chip,
  Stack,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import TagIcon from '@mui/icons-material/Tag';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { networkingApi } from '../../features/networking/services/networkingApi';

interface ConnectionNoteModalProps {
  open: boolean;
  connectionId: string;
  connectionName: string;
  initialNote?: string;
  initialLabels?: string[];
  onClose: () => void;
  onSave?: (noteText: string, labels: string[]) => void;
}

export const ConnectionNoteModal: React.FC<ConnectionNoteModalProps> = ({
  open,
  connectionId,
  connectionName,
  initialNote = '',
  initialLabels = [],
  onClose,
  onSave,
}) => {
  const [noteText, setNoteText] = useState(initialNote);
  const [labels, setLabels] = useState<string[]>(initialLabels);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setNoteText(initialNote);
      setLabels(initialLabels);
      // Fetch fresh notes from API
      if (connectionId) {
        networkingApi.getConnectionNotes(connectionId).then((notes) => {
          if (notes && notes.length > 0) {
            setNoteText(notes[0].text);
            if (notes[0].labels) setLabels(notes[0].labels);
          }
        }).catch(() => {});
      }
    }
  }, [open, connectionId, initialNote, initialLabels]);

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !labels.includes(trimmed)) {
      setLabels([...labels, trimmed]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setLabels(labels.filter((l) => l !== tagToRemove));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (connectionId) {
        await networkingApi.saveConnectionNote(connectionId, noteText, labels);
      }
      if (onSave) onSave(noteText, labels);
      onClose();
    } catch {
      alert('Failed to save note.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Clear private note and labels for this connection?')) {
      setNoteText('');
      setLabels([]);
      if (onSave) onSave('', []);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: '24px',
          p: 1,
          backdropFilter: 'blur(16px)',
          bgcolor: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(30, 41, 59, 0.9)'
              : 'rgba(255, 255, 255, 0.95)',
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 900, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <NoteAddIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Private Note & Labels ({connectionName})
          </Typography>
        </Stack>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Private notes are only visible to you. Use them to remember context, conversation topics, or relationship details.
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={4}
          label="Private Note"
          placeholder="Ex: Met at Dubai Tech Summit. Spoke about cloud native migration, follow up in March..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TagIcon fontSize="small" color="action" /> Relationship Labels
          </Typography>

          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2, gap: 1 }}>
            {labels.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 700, borderRadius: '8px' }}
              />
            ))}
            {labels.length === 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                No labels added yet.
              </Typography>
            )}
          </Stack>

          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              placeholder="Add tag (e.g. VIP, Client, Recruiter)"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              sx={{ flexGrow: 1 }}
            />
            <Button variant="outlined" onClick={handleAddTag} sx={{ borderRadius: '12px', fontWeight: 800 }}>
              Add Label
            </Button>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
        <Button
          color="error"
          startIcon={<DeleteOutlineIcon />}
          onClick={handleDelete}
          sx={{ borderRadius: '12px', fontWeight: 700 }}
        >
          Clear Note
        </Button>
        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} variant="outlined" sx={{ borderRadius: '12px', fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading}
            sx={{ borderRadius: '12px', fontWeight: 800 }}
          >
            Save Note & Labels
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default ConnectionNoteModal;

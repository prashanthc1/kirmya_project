'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LabelIcon from '@mui/icons-material/Label';

export interface TagItem {
  id: string;
  name: string;
  color: string;
}

interface Props {
  tags: TagItem[];
  onChange: (tags: TagItem[]) => void;
}

const defaultColors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899'];

export const CandidateTags: React.FC<Props> = ({ tags, onChange }) => {
  const [open, setOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#6366F1');

  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    const newTag: TagItem = {
      id: `tag_${Date.now()}`,
      name: newTagName,
      color: selectedColor,
    };
    onChange([...tags, newTag]);
    setNewTagName('');
    setOpen(false);
  };

  const handleRemoveTag = (id: string) => {
    onChange(tags.filter((t) => t.id !== id));
  };

  return (
    <Box>
      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        {tags.map((tag) => (
          <Chip
            key={tag.id}
            label={tag.name}
            onDelete={() => handleRemoveTag(tag.id)}
            size="small"
            sx={{
              bgcolor: `${tag.color}20`,
              color: tag.color,
              borderColor: tag.color,
              fontWeight: 800,
              fontSize: '0.75rem',
            }}
          />
        ))}
        <Button
          size="small"
          startIcon={<AddIcon fontSize="small" />}
          onClick={() => setOpen(true)}
          sx={{ borderRadius: '8px', fontSize: '0.75rem', fontWeight: 700 }}
        >
          Add Org Tag
        </Button>
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Create Organization Candidate Tag</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Tag Name"
            placeholder="e.g. High Priority / Technical Leader"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <Typography variant="caption" sx={{ fontWeight: 800, mb: 1, display: 'block' }}>Select Tag Color:</Typography>
          <Stack direction="row" spacing={1.5}>
            {defaultColors.map((col) => (
              <Box
                key={col}
                onClick={() => setSelectedColor(col)}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  bgcolor: col,
                  cursor: 'pointer',
                  border: selectedColor === col ? '3px solid #ffffff' : 'none',
                  boxShadow: selectedColor === col ? '0 0 0 2px #6366f1' : 'none',
                }}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddTag} sx={{ fontWeight: 800 }}>
            Create Tag
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CandidateTags;

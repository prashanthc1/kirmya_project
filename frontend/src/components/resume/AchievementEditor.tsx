'use client';

import React from 'react';
import { Box, Typography, Button, TextField, Stack, IconButton, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

export const AchievementEditor: React.FC<{ items: string[]; onChange: (items: string[]) => void }> = ({ items = [], onChange }) => {
  const handleAdd = () => onChange([...items, '']);
  const handleRemove = (index: number) => onChange(items.filter((_, i) => i !== index));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Key Achievements & Honors</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAdd} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
          Add Achievement
        </Button>
      </Box>

      <Stack spacing={2}>
        {items.map((ach, idx) => (
          <Box key={idx} sx={{ display: 'flex', gap: 1 }}>
            <TextField fullWidth size="small" label={`Achievement #${idx + 1}`} value={ach} onChange={(e) => {
              const updated = [...items]; updated[idx] = e.target.value; onChange(updated);
            }} />
            <IconButton size="small" color="error" onClick={() => handleRemove(idx)}><DeleteOutlineIcon /></IconButton>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

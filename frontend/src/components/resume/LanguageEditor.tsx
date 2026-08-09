'use client';

import React from 'react';
import { Box, Typography, Button, TextField, Stack, IconButton, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

export const LanguageEditor: React.FC<{ items: any[]; onChange: (items: any[]) => void }> = ({ items = [], onChange }) => {
  const handleAdd = () => onChange([...items, { language: '', proficiency: 'Native' }]);
  const handleRemove = (index: number) => onChange(items.filter((_, i) => i !== index));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Languages</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAdd} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
          Add Language
        </Button>
      </Box>

      <Stack spacing={2}>
        {items.map((lang, idx) => (
          <Box key={idx} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField fullWidth size="small" label="Language" value={lang.language || ''} onChange={(e) => {
              const updated = [...items]; updated[idx].language = e.target.value; onChange(updated);
            }} />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Proficiency</InputLabel>
              <Select value={lang.proficiency || 'Native'} label="Proficiency" onChange={(e) => {
                const updated = [...items]; updated[idx].proficiency = e.target.value; onChange(updated);
              }}>
                <MenuItem value="Native">Native / Bilingual</MenuItem>
                <MenuItem value="Fluent">Full Professional</MenuItem>
                <MenuItem value="Conversational">Conversational</MenuItem>
              </Select>
            </FormControl>
            <IconButton size="small" color="error" onClick={() => handleRemove(idx)}><DeleteOutlineIcon /></IconButton>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

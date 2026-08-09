'use client';

import React from 'react';
import { Box, Typography, Button, Grid, TextField, Stack, IconButton, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

export const ProjectEditor: React.FC<{ items: any[]; onChange: (items: any[]) => void }> = ({ items = [], onChange }) => {
  const handleAdd = () => {
    onChange([...items, { name: '', role: '', description: '', url: '' }]);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Key Projects & Repositories</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAdd} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
          Add Project
        </Button>
      </Box>

      <Stack spacing={2.5}>
        {items.map((proj, idx) => (
          <Paper key={idx} elevation={0} sx={{ p: 2.5, borderRadius: 3, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
              <IconButton size="small" color="error" onClick={() => handleRemove(idx)}><DeleteOutlineIcon /></IconButton>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Project Title" value={proj.name || ''} onChange={(e) => {
                  const updated = [...items]; updated[idx].name = e.target.value; onChange(updated);
                }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Your Role" value={proj.role || ''} onChange={(e) => {
                  const updated = [...items]; updated[idx].role = e.target.value; onChange(updated);
                }} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={2} label="Description & Stack Used" value={proj.description || ''} onChange={(e) => {
                  const updated = [...items]; updated[idx].description = e.target.value; onChange(updated);
                }} />
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

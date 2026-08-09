'use client';

import React from 'react';
import { Box, Typography, Button, Grid, TextField, Stack, IconButton, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

export const CertificationEditor: React.FC<{ items: any[]; onChange: (items: any[]) => void }> = ({ items = [], onChange }) => {
  const handleAdd = () => {
    onChange([...items, { title: '', issuingOrganization: '', issueDate: '', credentialId: '' }]);
  };

  const handleRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Certifications & Licenses</Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAdd} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
          Add Certification
        </Button>
      </Box>

      <Stack spacing={2.5}>
        {items.map((cert, idx) => (
          <Paper key={idx} elevation={0} sx={{ p: 2.5, borderRadius: 3, background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
              <IconButton size="small" color="error" onClick={() => handleRemove(idx)}><DeleteOutlineIcon /></IconButton>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Certification Name" value={cert.title || ''} onChange={(e) => {
                  const updated = [...items]; updated[idx].title = e.target.value; onChange(updated);
                }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Issuing Organization" value={cert.issuingOrganization || ''} onChange={(e) => {
                  const updated = [...items]; updated[idx].issuingOrganization = e.target.value; onChange(updated);
                }} />
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

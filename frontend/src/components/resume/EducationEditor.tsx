'use client';

import React from 'react';
import { Box, Typography, Button, Grid, TextField, Stack, IconButton, Paper } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { EducationItem } from '@/features/resume/types';

interface EducationEditorProps {
  education: EducationItem[];
  onChange: (items: EducationItem[]) => void;
}

export const EducationEditor: React.FC<EducationEditorProps> = ({ education, onChange }) => {
  const handleItemChange = (index: number, field: keyof EducationItem, value: string) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleAdd = () => {
    onChange([
      ...education,
      {
        institution: '',
        degree: '',
        fieldOfStudy: '',
        location: '',
        startDate: '',
        endDate: '',
        grade: '',
      },
    ]);
  };

  const handleRemove = (index: number) => {
    onChange(education.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Education & Credentials
        </Typography>
        <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleAdd} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
          Add Education
        </Button>
      </Box>

      <Stack spacing={3}>
        {education.map((edu, idx) => (
          <Paper
            key={idx}
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              position: 'relative',
            }}
          >
            <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
              <IconButton size="small" color="error" onClick={() => handleRemove(idx)}>
                <DeleteOutlineIcon />
              </IconButton>
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Institution / University" value={edu.institution} onChange={(e) => handleItemChange(idx, 'institution', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Degree (e.g. Bachelor of Science)" value={edu.degree} onChange={(e) => handleItemChange(idx, 'degree', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Field of Study" value={edu.fieldOfStudy} onChange={(e) => handleItemChange(idx, 'fieldOfStudy', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth label="Start Year" value={edu.startDate} onChange={(e) => handleItemChange(idx, 'startDate', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth label="End Year" value={edu.endDate} onChange={(e) => handleItemChange(idx, 'endDate', e.target.value)} />
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

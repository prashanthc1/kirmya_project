'use client';

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  Stack,
  IconButton,
  Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { ExperienceItem } from '@/features/resume/types';

interface ExperienceEditorProps {
  experiences: ExperienceItem[];
  onChange: (items: ExperienceItem[]) => void;
}

export const ExperienceEditor: React.FC<ExperienceEditorProps> = ({ experiences, onChange }) => {
  const handleItemChange = (index: number, field: keyof ExperienceItem, value: any) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleAdd = () => {
    onChange([
      ...experiences,
      {
        company: '',
        jobTitle: '',
        employmentType: 'Full-time',
        location: '',
        startDate: '',
        endDate: '',
        currentlyWorking: true,
        description: '',
        responsibilities: ['Architected microservices.'],
        achievements: [],
        skills: [],
      },
    ]);
  };

  const handleRemove = (index: number) => {
    onChange(experiences.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Work Experience
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
        >
          Add Position
        </Button>
      </Box>

      <Stack spacing={3}>
        {experiences.map((exp, idx) => (
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
                <TextField
                  fullWidth
                  label="Company Name"
                  value={exp.company}
                  onChange={(e) => handleItemChange(idx, 'company', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Job Title"
                  value={exp.jobTitle}
                  onChange={(e) => handleItemChange(idx, 'jobTitle', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={exp.location}
                  onChange={(e) => handleItemChange(idx, 'location', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Start Date"
                  placeholder="YYYY-MM"
                  value={exp.startDate}
                  onChange={(e) => handleItemChange(idx, 'startDate', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="End Date"
                  placeholder="YYYY-MM"
                  disabled={exp.currentlyWorking}
                  value={exp.currentlyWorking ? 'Present' : exp.endDate}
                  onChange={(e) => handleItemChange(idx, 'endDate', e.target.value)}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={exp.currentlyWorking}
                      onChange={(e) => handleItemChange(idx, 'currentlyWorking', e.target.checked)}
                    />
                  }
                  label="I currently work here"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Responsibilities & Bullet Points (One per line)"
                  value={Array.isArray(exp.responsibilities) ? exp.responsibilities.join('\n') : ''}
                  onChange={(e) => handleItemChange(idx, 'responsibilities', e.target.value.split('\n'))}
                />
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

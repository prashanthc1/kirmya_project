'use client';

import React, { useState } from 'react';
import {
  Card,
  Typography,
  Grid,
  TextField,
  Button,
  Stack,
  FormControlLabel,
  Checkbox,
  Box,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { WorkExperienceItem, profileApi } from '../../features/profile/services/profileApi';

export const ExperienceEditor: React.FC<{ initialExperiences?: WorkExperienceItem[] }> = ({ initialExperiences = [] }) => {
  const [experiences, setExperiences] = useState<WorkExperienceItem[]>(initialExperiences);
  const [newExp, setNewExp] = useState<WorkExperienceItem>({
    company: '',
    jobTitle: '',
    employmentType: 'Full-time',
    location: '',
    startDate: '',
    endDate: '',
    isCurrentJob: false,
    description: '',
  });

  const handleAdd = async () => {
    if (!newExp.company || !newExp.jobTitle || !newExp.startDate) {
      alert('Company, Job Title, and Start Date are required.');
      return;
    }
    if (newExp.endDate && !newExp.isCurrentJob && newExp.endDate < newExp.startDate) {
      alert('End date cannot precede start date.');
      return;
    }

    try {
      const updated = await profileApi.addExperience(newExp);
      setExperiences(updated);
      setNewExp({
        company: '',
        jobTitle: '',
        employmentType: 'Full-time',
        location: '',
        startDate: '',
        endDate: '',
        isCurrentJob: false,
        description: '',
      });
    } catch (e) {
      alert('Failed to add experience.');
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      await profileApi.deleteExperience(id);
      setExperiences(experiences.filter((e) => e.id !== id));
    } catch (e) {
      alert('Failed to delete experience.');
    }
  };

  return (
    <Card sx={{ borderRadius: '24px', p: 3, mb: 4, bgcolor: 'background.paper' }}>
      <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
        3. Work Experience Management
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Company"
            value={newExp.company}
            onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Job Title"
            value={newExp.jobTitle}
            onChange={(e) => setNewExp({ ...newExp, jobTitle: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            label="Start Date"
            InputLabelProps={{ shrink: true }}
            value={newExp.startDate}
            onChange={(e) => setNewExp({ ...newExp, startDate: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            label="End Date"
            disabled={newExp.isCurrentJob}
            InputLabelProps={{ shrink: true }}
            value={newExp.endDate}
            onChange={(e) => setNewExp({ ...newExp, endDate: e.target.value })}
          />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={newExp.isCurrentJob}
                onChange={(e) => setNewExp({ ...newExp, isCurrentJob: e.target.checked })}
              />
            }
            label="I currently work in this role"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Role Responsibilities & Achievements"
            value={newExp.description}
            onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
          />
        </Grid>
      </Grid>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleAdd}
        sx={{ borderRadius: '12px', fontWeight: 800, mb: 3 }}
      >
        Add Work Experience
      </Button>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>
        Saved Work Experiences ({experiences.length})
      </Typography>
      <Stack spacing={2}>
        {experiences.map((exp, idx) => (
          <Card key={exp.id || idx} variant="outlined" sx={{ p: 2, borderRadius: '16px' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {exp.jobTitle} @ {exp.company}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {exp.startDate} - {exp.isCurrentJob ? 'Present' : exp.endDate || 'Present'}
                </Typography>
              </Box>
              <Button color="error" size="small" onClick={() => handleDelete(exp.id)}>
                <DeleteIcon />
              </Button>
            </Stack>
          </Card>
        ))}
      </Stack>
    </Card>
  );
};

export default ExperienceEditor;

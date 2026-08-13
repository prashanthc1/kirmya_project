'use client';

import React, { useState } from 'react';
import {
  Card,
  Typography,
  Grid,
  TextField,
  Button,
  Stack,
  Box,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { EducationItem, profileApi } from '../../features/profile/services/profileApi';

export const EducationEditor: React.FC<{ initialEducations?: EducationItem[] }> = ({ initialEducations = [] }) => {
  const [educations, setEducations] = useState<EducationItem[]>(initialEducations);
  const [newEdu, setNewEdu] = useState<EducationItem>({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    startDate: '',
    endDate: '',
    description: '',
  });

  const handleAdd = async () => {
    if (!newEdu.institution || !newEdu.degree) {
      alert('Institution and Degree are required.');
      return;
    }

    try {
      const updated = await profileApi.addEducation(newEdu);
      setEducations(updated);
      setNewEdu({
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        description: '',
      });
    } catch (e) {
      alert('Failed to add education.');
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      await profileApi.deleteEducation(id);
      setEducations(educations.filter((e) => e.id !== id));
    } catch (e) {
      alert('Failed to delete education.');
    }
  };

  return (
    <Card sx={{ borderRadius: '24px', p: 3, mb: 4, bgcolor: 'background.paper' }}>
      <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
        4. Education & Academic Credentials
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Institution / University"
            value={newEdu.institution}
            onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Degree"
            value={newEdu.degree}
            onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Field of Study"
            value={newEdu.fieldOfStudy}
            onChange={(e) => setNewEdu({ ...newEdu, fieldOfStudy: e.target.value })}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            label="Start Date"
            InputLabelProps={{ shrink: true }}
            value={newEdu.startDate}
            onChange={(e) => setNewEdu({ ...newEdu, startDate: e.target.value })}
          />
        </Grid>
      </Grid>

      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleAdd}
        sx={{ borderRadius: '12px', fontWeight: 800, mb: 3 }}
      >
        Add Education Item
      </Button>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>
        Saved Education ({educations.length})
      </Typography>
      <Stack spacing={2}>
        {educations.map((edu, idx) => (
          <Card key={edu.id || idx} variant="outlined" sx={{ p: 2, borderRadius: '16px' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {edu.degree} @ {edu.institution}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {edu.fieldOfStudy}
                </Typography>
              </Box>
              <Button color="error" size="small" onClick={() => handleDelete(edu.id)}>
                <DeleteIcon />
              </Button>
            </Stack>
          </Card>
        ))}
      </Stack>
    </Card>
  );
};

export default EducationEditor;

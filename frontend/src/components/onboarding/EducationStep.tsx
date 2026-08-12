'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  Stack,
  Paper,
  IconButton,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { motion } from 'framer-motion';
import { springs } from '../../theme/motion';
import GlassCard from '../landing/GlassCard';
import { EducationItem } from '../../features/onboarding/types';

interface StepProps {
  onNext: (data?: any) => void;
  onPrev: () => void;
}

export const EducationStep: React.FC<StepProps> = ({ onNext, onPrev }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [educations, setEducations] = useState<EducationItem[]>([
    {
      institution: 'University of Technology',
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Science & Operations Management',
      startDate: '2017-09',
      endDate: '2021-06',
      grade: '3.8/4.0',
      description: 'Focus on distributed software systems, database management, and facilities operational research.',
    },
  ]);

  const handleAdd = () => {
    setEducations([
      ...educations,
      {
        institution: '',
        degree: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        grade: '',
        description: '',
      },
    ]);
  };

  const handleRemove = (index: number) => {
    setEducations(educations.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof EducationItem, value: string) => {
    const updated = [...educations];
    updated[index][field] = value;
    setEducations(updated);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={springs.entrance}>
      <GlassCard sx={{ p: { xs: 3, md: 5 } }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Education History
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Add degrees, diplomas, or academic qualifications.
        </Typography>

        <Stack spacing={3} sx={{ mb: 4 }}>
          {educations.map((edu, idx) => (
            <Paper
              key={idx}
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  Education #{idx + 1}
                </Typography>
                {educations.length > 1 && (
                  <IconButton onClick={() => handleRemove(idx)} color="error" size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Institution Name *"
                    fullWidth
                    value={edu.institution}
                    onChange={(e) => handleChange(idx, 'institution', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Degree *"
                    fullWidth
                    value={edu.degree}
                    onChange={(e) => handleChange(idx, 'degree', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Field of Study"
                    fullWidth
                    value={edu.fieldOfStudy}
                    onChange={(e) => handleChange(idx, 'fieldOfStudy', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Grade / GPA"
                    fullWidth
                    value={edu.grade}
                    onChange={(e) => handleChange(idx, 'grade', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Start Date (YYYY-MM)"
                    fullWidth
                    value={edu.startDate}
                    onChange={(e) => handleChange(idx, 'startDate', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="End Date (YYYY-MM)"
                    fullWidth
                    value={edu.endDate}
                    onChange={(e) => handleChange(idx, 'endDate', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Description / Key Projects"
                    multiline
                    rows={2}
                    fullWidth
                    value={edu.description}
                    onChange={(e) => handleChange(idx, 'description', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Stack>

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{ mb: 4, borderRadius: '12px', fontWeight: 700, textTransform: 'none' }}
        >
          Add Another Education
        </Button>

        <Stack direction="row" justifyContent="space-between">
          <Button variant="text" onClick={onPrev} startIcon={<ArrowBackIcon />} sx={{ fontWeight: 700 }}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={() => onNext({ educations })}
            endIcon={<ArrowForwardIcon />}
            sx={{ py: 1.2, px: 3.5, borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
          >
            Continue
          </Button>
        </Stack>
      </GlassCard>
    </motion.div>
  );
};

export default EducationStep;

'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  Stack,
  Paper,
  IconButton,
  MenuItem,
  useTheme,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { motion } from 'framer-motion';
import GlassCard from '../landing/GlassCard';
import { WorkExperienceItem } from '../../features/onboarding/types';

interface StepProps {
  onNext: (data?: any) => void;
  onPrev: () => void;
}

export const ExperienceStep: React.FC<StepProps> = ({ onNext, onPrev }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [experiences, setExperiences] = useState<WorkExperienceItem[]>([
    {
      company: 'Emaar Facilities Management',
      jobTitle: 'Senior Facilities Operations Lead',
      employmentType: 'Full-time',
      location: 'Dubai, UAE',
      startDate: '2021-03',
      endDate: '2024-05',
      isCurrentJob: false,
      responsibilities: 'Managed vendor SLA contracts, building maintenance teams, and HSE compliance.',
      achievements: 'Reduced annual vendor maintenance costs by 18% through SLA contract renegotiation.',
    },
  ]);

  const handleAddExperience = () => {
    setExperiences([
      ...experiences,
      {
        company: '',
        jobTitle: '',
        employmentType: 'Full-time',
        location: '',
        startDate: '',
        endDate: '',
        isCurrentJob: false,
        responsibilities: '',
        achievements: '',
      },
    ]);
  };

  const handleRemove = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof WorkExperienceItem, value: any) => {
    const updated = [...experiences];
    (updated[index] as any)[field] = value;
    setExperiences(updated);
  };

  const handleAIRewrite = (index: number) => {
    const updated = [...experiences];
    updated[index].achievements =
      'Spearheaded vendor SLA optimization program across 12 commercial properties, cutting annual operating costs by 18% ($450K) while maintaining 99.4% facility uptime.';
    setExperiences(updated);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <GlassCard sx={{ p: { xs: 3, md: 5 } }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Work Experience
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Detail your work history to establish credibility and highlight career achievements.
        </Typography>

        <Stack spacing={4} sx={{ mb: 4 }}>
          {experiences.map((exp, idx) => (
            <Paper
              key={idx}
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                position: 'relative',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  Experience #{idx + 1}
                </Typography>
                {experiences.length > 1 && (
                  <IconButton onClick={() => handleRemove(idx)} color="error" size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Company Name *"
                    fullWidth
                    value={exp.company}
                    onChange={(e) => handleChange(idx, 'company', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Job Title *"
                    fullWidth
                    value={exp.jobTitle}
                    onChange={(e) => handleChange(idx, 'jobTitle', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    label="Employment Type"
                    fullWidth
                    value={exp.employmentType}
                    onChange={(e) => handleChange(idx, 'employmentType', e.target.value)}
                  >
                    {['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'].map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Location"
                    fullWidth
                    value={exp.location}
                    onChange={(e) => handleChange(idx, 'location', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Start Date (YYYY-MM)"
                    placeholder="2021-03"
                    fullWidth
                    value={exp.startDate}
                    onChange={(e) => handleChange(idx, 'startDate', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="End Date (YYYY-MM)"
                    placeholder="2024-05"
                    disabled={exp.isCurrentJob}
                    fullWidth
                    value={exp.isCurrentJob ? 'Present' : exp.endDate}
                    onChange={(e) => handleChange(idx, 'endDate', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={exp.isCurrentJob}
                        onChange={(e) => handleChange(idx, 'isCurrentJob', e.target.checked)}
                      />
                    }
                    label="I currently work here"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Key Responsibilities"
                    multiline
                    rows={2}
                    fullWidth
                    value={exp.responsibilities}
                    onChange={(e) => handleChange(idx, 'responsibilities', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                      Key Achievements
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AutoAwesomeIcon fontSize="small" />}
                      onClick={() => handleAIRewrite(idx)}
                      sx={{ color: '#a855f7', fontWeight: 700, textTransform: 'none', fontSize: '0.75rem' }}
                    >
                      AI Rewrite &amp; Enhance
                    </Button>
                  </Stack>
                  <TextField
                    multiline
                    rows={2}
                    fullWidth
                    value={exp.achievements}
                    onChange={(e) => handleChange(idx, 'achievements', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Stack>

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddExperience}
          sx={{ mb: 4, borderRadius: '12px', fontWeight: 700, textTransform: 'none' }}
        >
          Add Another Experience
        </Button>

        <Stack direction="row" justifyContent="space-between">
          <Button variant="text" onClick={onPrev} startIcon={<ArrowBackIcon />} sx={{ fontWeight: 700 }}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={() => onNext({ experiences })}
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

export default ExperienceStep;

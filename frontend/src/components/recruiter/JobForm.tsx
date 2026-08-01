'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  Stack,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  Chip,
  Paper,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import GlassCard from '../landing/GlassCard';
import { recruiterApi } from '../../features/recruiter/api';

export const JobForm: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [skills, setSkills] = React.useState<string[]>(['Golang', 'PostgreSQL', 'Docker', 'REST API']);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      title: 'Senior Microservices Engineer (Golang)',
      department: 'Engineering & Technology',
      employmentType: 'Full-time',
      experienceLevel: 'Senior Level (5+ Years)',
      description: 'We are seeking an experienced Golang Engineer to design scalable cloud microservices.',
      responsibilities: 'Build high-performance REST APIs, write Unit tests, optimize PostgreSQL queries.',
      requirements: '5+ years Golang experience, experience with Gin/Gorm/Pgx, Docker & Kubernetes.',
      country: 'United Arab Emirates',
      city: 'Dubai',
      remoteOption: 'Hybrid',
      salaryRange: '$80,000 - $110,000',
      currency: 'USD',
      deadline: '2026-09-30',
      autoResponse: true,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await recruiterApi.createJob({
        title: data.title,
        department: data.department,
        description: data.description,
        location: `${data.city}, ${data.country} (${data.remoteOption})`,
        salaryRange: `${data.salaryRange} ${data.currency}`,
        employmentType: data.employmentType,
        deadline: data.deadline,
      });
      router.push('/recruiter/jobs');
    } catch {
      router.push('/recruiter/jobs');
    }
  };

  return (
    <GlassCard sx={{ p: { xs: 3, md: 5 } }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push('/recruiter/jobs')} sx={{ fontWeight: 700 }}>
          Back
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Post a New Job Opening
        </Typography>
      </Stack>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Section 1: Basic Info */}
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>
          1. Basic Job Details
        </Typography>
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={8}>
            <TextField label="Job Title *" fullWidth {...register('title', { required: true })} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select label="Department *" fullWidth {...register('department')}>
              {['Engineering & Technology', 'Facilities & Real Estate', 'Human Resources', 'Finance', 'Sales & Marketing', 'Operations'].map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Employment Type *" fullWidth {...register('employmentType')}>
              {['Full-time', 'Part-time', 'Contract', 'Freelance'].map((t) => (
                <MenuItem key={t} value={t}>
                  {t}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Experience Level *" fullWidth {...register('experienceLevel')}>
              {['Entry Level (0-2 Yrs)', 'Mid Level (2-5 Yrs)', 'Senior Level (5+ Yrs)', 'Director / Executive'].map((e) => (
                <MenuItem key={e} value={e}>
                  {e}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField label="Job Overview & Description *" multiline rows={3} fullWidth {...register('description')} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Key Responsibilities *" multiline rows={3} fullWidth {...register('responsibilities')} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Requirements & Qualifications *" multiline rows={3} fullWidth {...register('requirements')} />
          </Grid>

          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={['Golang', 'React', 'TypeScript', 'PostgreSQL', 'Docker', 'Kubernetes', 'AWS', 'SLA Auditing', 'HVAC']}
              value={skills}
              onChange={(_, val) => setSkills(val)}
              freeSolo
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} key={option} />
                ))
              }
              renderInput={(params) => <TextField {...params} label="Required Skills *" placeholder="Add skills" />}
            />
          </Grid>
        </Grid>

        {/* Section 2: Location & Compensation */}
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'primary.main' }}>
          2. Location &amp; Compensation
        </Typography>
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <TextField label="Country *" fullWidth {...register('country')} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="City *" fullWidth {...register('city')} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select label="Work Arrangement *" fullWidth {...register('remoteOption')}>
              {['On-site', 'Hybrid', 'Remote'].map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField label="Estimated Salary Range *" fullWidth {...register('salaryRange')} placeholder="e.g. $80,000 - $110,000" />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Application Deadline *" type="date" InputLabelProps={{ shrink: true }} fullWidth {...register('deadline')} />
          </Grid>
        </Grid>

        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button variant="outlined" onClick={() => router.push('/recruiter/jobs')} sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="large"
            startIcon={<CheckIcon />}
            sx={{ py: 1.4, px: 4, borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
          >
            Publish Job Listing
          </Button>
        </Stack>
      </form>
    </GlassCard>
  );
};

export default JobForm;

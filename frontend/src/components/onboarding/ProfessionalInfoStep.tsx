'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  Stack,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { motion } from 'framer-motion';
import { springs } from '../../theme/motion';
import GlassCard from '../landing/GlassCard';

interface StepProps {
  onNext: (data?: any) => void;
  onPrev: () => void;
}

export const ProfessionalInfoStep: React.FC<StepProps> = ({ onNext, onPrev }) => {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      employmentStatus: 'Looking for Work',
      currentJobTitle: 'Facilities Operations Coordinator',
      yearsExperience: 6,
      industry: 'Facilities Management & Real Estate',
      department: 'Operations',
      employmentType: 'Full-time',
      expectedSalary: '$65,000 - $85,000',
      preferredCurrency: 'USD',
      noticePeriod: 'Immediately',
      preferredWorkMode: 'Hybrid',
    },
  });

  const onSubmit = (data: any) => {
    onNext(data);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.entrance}>
      <GlassCard sx={{ p: { xs: 3, md: 5 } }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Professional Details
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Specify your current employment situation and target compensation expectations.
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                select
                label="Current Employment Status *"
                fullWidth
                {...register('employmentStatus')}
              >
                {['Looking for Work', 'Employed', 'Freelancer', 'Student', 'Entrepreneur'].map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField label="Current / Recent Job Title" fullWidth {...register('currentJobTitle')} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField label="Years of Experience" type="number" fullWidth {...register('yearsExperience')} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField label="Industry" fullWidth {...register('industry')} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField label="Department / Functional Area" fullWidth {...register('department')} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField select label="Employment Type Preference" fullWidth {...register('employmentType')}>
                {['Full-time', 'Part-time', 'Contract', 'Freelance'].map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField select label="Notice Period" fullWidth {...register('noticePeriod')}>
                {['Immediately', '15 Days', '1 Month', '2 Months', '3 Months'].map((np) => (
                  <MenuItem key={np} value={np}>
                    {np}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={8}>
              <TextField label="Expected Annual Salary" fullWidth {...register('expectedSalary')} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField select label="Currency" fullWidth {...register('preferredCurrency')}>
                {['USD', 'AED', 'EUR', 'GBP', 'INR', 'CAD'].map((curr) => (
                  <MenuItem key={curr} value={curr}>
                    {curr}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ fontWeight: 700, mb: 1 }}>
                  Preferred Work Mode
                </FormLabel>
                <RadioGroup row defaultValue="Hybrid" {...register('preferredWorkMode')}>
                  <FormControlLabel value="On-site" control={<Radio size="small" />} label="On-site" />
                  <FormControlLabel value="Hybrid" control={<Radio size="small" />} label="Hybrid" />
                  <FormControlLabel value="Remote" control={<Radio size="small" />} label="Remote" />
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>

          <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
            <Button variant="text" onClick={onPrev} startIcon={<ArrowBackIcon />} sx={{ fontWeight: 700 }}>
              Back
            </Button>
            <Button
              type="submit"
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              sx={{ py: 1.2, px: 3.5, borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
            >
              Continue
            </Button>
          </Stack>
        </form>
      </GlassCard>
    </motion.div>
  );
};

export default ProfessionalInfoStep;

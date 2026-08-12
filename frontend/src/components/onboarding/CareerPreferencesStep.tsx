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
  FormControlLabel,
  Checkbox,
  Autocomplete,
  Chip,
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

export const CareerPreferencesStep: React.FC<StepProps> = ({ onNext, onPrev }) => {
  const [desiredTitles, setDesiredTitles] = React.useState<string[]>([
    'Facilities Manager',
    'Operations Director',
  ]);
  const [preferredIndustries, setPreferredIndustries] = React.useState<string[]>([
    'Real Estate & Facilities',
    'Technology',
  ]);
  const [preferredCountries, setPreferredCountries] = React.useState<string[]>([
    'United Arab Emirates',
    'Saudi Arabia',
    'Qatar',
  ]);

  const { register, handleSubmit } = useForm({
    defaultValues: {
      remotePreference: 'Hybrid',
      expectedSalary: '$65,000 - $85,000',
      preferredCurrency: 'USD',
      preferredCompanySize: '100-500 employees',
      travelWillingness: 'Up to 25%',
      visaSponsorshipRequired: false,
    },
  });

  const onSubmit = (data: any) => {
    onNext({
      ...data,
      desiredJobTitles: desiredTitles,
      preferredIndustries,
      preferredCountries,
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.entrance}>
      <GlassCard sx={{ p: { xs: 3, md: 5 } }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Career Preferences
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Specify target job titles, locations, remote work preferences, and visa requirements.
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={['Facilities Manager', 'Operations Director', 'Systems Architect', 'Software Engineer', 'Product Manager']}
                value={desiredTitles}
                onChange={(_, val) => setDesiredTitles(val)}
                freeSolo
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} key={option} />
                  ))
                }
                renderInput={(params) => <TextField {...params} label="Desired Job Titles *" placeholder="Add job titles" />}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                options={['Real Estate & Facilities', 'Technology', 'Financial Services', 'Healthcare', 'Energy']}
                value={preferredIndustries}
                onChange={(_, val) => setPreferredIndustries(val)}
                freeSolo
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} key={option} />
                  ))
                }
                renderInput={(params) => <TextField {...params} label="Preferred Industries" placeholder="Add industries" />}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Autocomplete
                multiple
                options={['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'United States', 'United Kingdom']}
                value={preferredCountries}
                onChange={(_, val) => setPreferredCountries(val)}
                freeSolo
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} key={option} />
                  ))
                }
                renderInput={(params) => <TextField {...params} label="Preferred Countries" placeholder="Add countries" />}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField select label="Remote Work Preference" fullWidth {...register('remotePreference')}>
                {['On-site', 'Hybrid', 'Remote', 'Flexible'].map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField select label="Preferred Company Size" fullWidth {...register('preferredCompanySize')}>
                {['1-10 (Startup)', '11-50 (Growth)', '51-200 (Mid-size)', '201-1000 (Enterprise)', '1000+ (Multinational)'].map((size) => (
                  <MenuItem key={size} value={size}>
                    {size}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField select label="Travel Willingness" fullWidth {...register('travelWillingness')}>
                {['No Travel', 'Up to 25%', 'Up to 50%', '50%+ Travel'].map((tr) => (
                  <MenuItem key={tr} value={tr}>
                    {tr}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={<Checkbox {...register('visaSponsorshipRequired')} />}
                label="Visa Sponsorship Required"
                sx={{ mt: 1 }}
              />
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

export default CareerPreferencesStep;

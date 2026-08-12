'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  Stack,
  Autocomplete,
  Chip,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { motion } from 'framer-motion';
import { springs } from '../../theme/motion';
import GlassCard from '../landing/GlassCard';

const schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  headline: z.string().optional(),
  professionalSummary: z.string().optional(),
  currentLocation: z.string().optional(),
  country: z.string().optional(),
  nationality: z.string().optional(),
  phoneNumber: z.string().optional(),
  timezone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface StepProps {
  onNext: (data?: any) => void;
  onPrev: () => void;
}

export const PersonalInfoStep: React.FC<StepProps> = ({ onNext, onPrev }) => {
  const [selectedLanguages, setSelectedLanguages] = React.useState<string[]>(['English']);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: 'Prashanth',
      lastName: 'Choudhary',
      headline: 'Facilities Operations Manager & Systems Architect',
      professionalSummary: 'Experienced operations leader specializing in vendor management and automated workflow infrastructure.',
      currentLocation: 'Dubai',
      country: 'United Arab Emirates',
      nationality: 'Indian',
      phoneNumber: '+971 50 123 4567',
      timezone: 'GST (UTC+4)',
    },
  });

  const onSubmit = (data: FormData) => {
    onNext({ ...data, languages: selectedLanguages });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={springs.entrance}>
      <GlassCard sx={{ p: { xs: 3, md: 5 } }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Personal Information
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Provide basic details so companies and peers can identify and contact you.
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name *"
                fullWidth
                {...register('firstName')}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name *"
                fullWidth
                {...register('lastName')}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Professional Headline"
                placeholder="e.g. Facilities Manager | Systems Architect | AI Specialist"
                fullWidth
                {...register('headline')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Professional Summary"
                multiline
                rows={3}
                placeholder="Briefly describe your career focus and core value proposition..."
                fullWidth
                {...register('professionalSummary')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Current City / Location" fullWidth {...register('currentLocation')} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Country" fullWidth {...register('country')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Nationality" fullWidth {...register('nationality')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Phone Number" fullWidth {...register('phoneNumber')} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Timezone" fullWidth {...register('timezone')} />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={['English', 'Arabic', 'French', 'Spanish', 'German', 'Hindi', 'Mandarin']}
                value={selectedLanguages}
                onChange={(_, newValue) => setSelectedLanguages(newValue)}
                freeSolo
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} key={option} />
                  ))
                }
                renderInput={(params) => <TextField {...params} label="Languages Spoken" placeholder="Add languages" />}
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

export default PersonalInfoStep;

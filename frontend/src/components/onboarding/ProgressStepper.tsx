'use client';

import React from 'react';
import { Box, Typography, LinearProgress, Stack, Chip, useTheme } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface ProgressStepperProps {
  currentStep: number;
  totalSteps?: number;
}

const STEP_TITLES: { [key: number]: { title: string; estMinutes: number } } = {
  1: { title: 'Welcome & Introduction', estMinutes: 1 },
  2: { title: 'Profile Photo Upload', estMinutes: 1 },
  3: { title: 'Personal Information', estMinutes: 2 },
  4: { title: 'Professional Details', estMinutes: 2 },
  5: { title: 'Skills & Proficiencies', estMinutes: 2 },
  6: { title: 'Work Experience', estMinutes: 3 },
  7: { title: 'Education History', estMinutes: 2 },
  8: { title: 'Certifications & Licenses', estMinutes: 2 },
  9: { title: 'Resume Upload & AI Parsing', estMinutes: 2 },
  10: { title: 'Career Preferences', estMinutes: 2 },
  11: { title: 'Job Alerts & Notifications', estMinutes: 1 },
  12: { title: 'Recommended Communities', estMinutes: 1 },
  13: { title: 'Connection Suggestions', estMinutes: 1 },
  14: { title: 'AI Profile Review', estMinutes: 1 },
  15: { title: 'Onboarding Complete', estMinutes: 0 },
};

export const ProgressStepper: React.FC<ProgressStepperProps> = ({ currentStep, totalSteps = 15 }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const percentage = Math.round(((currentStep - 1) / (totalSteps - 1)) * 100);
  const info = STEP_TITLES[currentStep] || { title: `Step ${currentStep}`, estMinutes: 2 };
  const estRemaining = Object.keys(STEP_TITLES)
    .map(Number)
    .filter((s) => s >= currentStep)
    .reduce((sum, s) => sum + (STEP_TITLES[s]?.estMinutes || 0), 0);

  return (
    <Box sx={{ mb: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1 }}>
            Step {currentStep} of {totalSteps}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
            {info.title}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {estRemaining > 0 && (
            <Chip
              icon={<AccessTimeIcon fontSize="small" sx={{ color: 'primary.main !important' }} />}
              label={`~${estRemaining} min remaining`}
              size="small"
              sx={{
                bgcolor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
                color: 'text.primary',
                fontWeight: 700,
                fontSize: '0.75rem',
              }}
            />
          )}
          <Chip
            icon={<CheckCircleIcon fontSize="small" sx={{ color: '#10b981 !important' }} />}
            label={`${percentage}% Complete`}
            size="small"
            sx={{
              bgcolor: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              fontWeight: 800,
              fontSize: '0.75rem',
            }}
          />
        </Stack>
      </Stack>

      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 8,
          borderRadius: 4,
          bgcolor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
          '& .MuiLinearProgress-bar': {
            borderRadius: 4,
            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
          },
        }}
      />
    </Box>
  );
};

export default ProgressStepper;

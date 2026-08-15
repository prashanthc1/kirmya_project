'use client';

import React from 'react';
import {
  Card,
  Typography,
  Box,
  LinearProgress,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Link from 'next/link';
import { ProfileCompleteness } from '../../features/profile/types';

interface ProfileCompletenessCardProps {
  completeness?: ProfileCompleteness;
  percentage?: number;
}

export const ProfileCompletenessCard: React.FC<ProfileCompletenessCardProps> = ({
  completeness,
  percentage = 85,
}) => {
  const currentPercentage = completeness?.percentage ?? percentage;

  const defaultMissingSections = [
    { key: 'experience', label: 'Add Work Experience', actionUrl: '/profile/edit#experience', weight: 15 },
    { key: 'skills', label: 'Add at least 3 Key Skills', actionUrl: '/profile/edit#skills', weight: 10 },
    { key: 'certification', label: 'Add Certifications', actionUrl: '/profile/edit#certifications', weight: 10 },
    { key: 'resume', label: 'Upload Updated Resume', actionUrl: '/profile/edit#resume', weight: 15 },
  ];

  const missing = completeness?.missingSections ?? defaultMissingSections;

  return (
    <Card
      sx={{
        p: 3,
        borderRadius: '24px',
        mb: 3,
        bgcolor: 'background.paper',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Profile Completeness
        </Typography>
        <Chip
          label={`${currentPercentage}%`}
          color={currentPercentage >= 80 ? 'success' : currentPercentage >= 50 ? 'warning' : 'error'}
          sx={{ fontWeight: 900, borderRadius: '10px' }}
        />
      </Stack>

      <Box sx={{ mb: 2.5 }}>
        <LinearProgress
          variant="determinate"
          value={currentPercentage}
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
              background: currentPercentage >= 80
                ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
            },
          }}
        />
      </Box>

      {missing.length > 0 ? (
        <>
          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 700, mb: 1 }}>
            Complete these items to boost recruiter search visibility:
          </Typography>
          <List disablePadding>
            {missing.map((item) => (
              <ListItem
                key={item.key}
                sx={{
                  px: 0,
                  py: 0.75,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <ListItemIcon sx={{ minWidth: 'auto', color: 'text.secondary' }}>
                    <RadioButtonUncheckedIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                  />
                </Stack>

                <Button
                  component={Link}
                  href={item.actionUrl || '/profile/edit'}
                  size="small"
                  endIcon={<ArrowForwardIcon fontSize="small" />}
                  sx={{ textTransform: 'none', fontWeight: 700, borderRadius: '8px' }}
                >
                  Add
                </Button>
              </ListItem>
            ))}
          </List>
        </>
      ) : (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'success.main', mt: 1 }}>
          <CheckCircleIcon fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            Your candidate profile is fully complete and optimized!
          </Typography>
        </Stack>
      )}
    </Card>
  );
};

export default ProfileCompletenessCard;

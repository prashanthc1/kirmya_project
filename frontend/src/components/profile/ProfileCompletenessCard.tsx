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
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Link from 'next/link';

import { ProfileCompleteness } from '../../features/profile/types';
import { tokens } from '../../theme/tokens';
import { ROUTES } from '../../shared/routes';

interface ProfileCompletenessCardProps {
  completeness?: ProfileCompleteness;
  percentage?: number;
}

export const ProfileCompletenessCard: React.FC<ProfileCompletenessCardProps> = ({
  completeness,
  percentage = 0,
}) => {
  const currentPercentage = completeness?.percentage ?? percentage;

  const defaultMissingSections = [
    { key: 'experience', label: 'Add Work Experience', actionUrl: `${ROUTES.EDIT_PROFILE}#experience`, weight: 20 },
    { key: 'skills', label: 'Add Key Skills', actionUrl: `${ROUTES.EDIT_PROFILE}#skills`, weight: 15 },
    { key: 'education', label: 'Add Education Details', actionUrl: `${ROUTES.EDIT_PROFILE}#education`, weight: 15 },
    { key: 'preferences', label: 'Set Career Preferences', actionUrl: `${ROUTES.EDIT_PROFILE}#preferences`, weight: 15 },
  ];

  const missing = completeness?.missingSections ?? defaultMissingSections;

  return (
    <Card
      elevation={1}
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: `${tokens.radius.lg}px`,
        mb: 3,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
          Profile Completeness
        </Typography>
        <Chip
          label={`${currentPercentage}%`}
          color={currentPercentage >= 80 ? 'success' : currentPercentage >= 50 ? 'warning' : 'default'}
          size="small"
          sx={{ fontWeight: 700 }}
        />
      </Stack>

      <Box sx={{ mb: 2.5 }}>
        <LinearProgress
          variant="determinate"
          value={currentPercentage}
          sx={{
            height: 8,
            borderRadius: 4,
            bgcolor: 'action.hover',
          }}
        />
      </Box>

      {currentPercentage < 100 && missing.length > 0 ? (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
            Complete missing areas to maximize recruiter discovery:
          </Typography>
          <List disablePadding>
            {missing.map((item) => (
              <ListItem
                key={item.key}
                disableGutters
                sx={{
                  py: 0.75,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <ListItemIcon sx={{ minWidth: 'auto', color: 'text.secondary' }}>
                    <RadioButtonUncheckedIcon sx={{ fontSize: 16 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                  />
                </Stack>

                <Button
                  component={Link}
                  href={item.actionUrl || ROUTES.EDIT_PROFILE}
                  size="small"
                  endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Add
                </Button>
              </ListItem>
            ))}
          </List>
        </>
      ) : (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ color: 'success.main', mt: 1 }}>
          <CheckCircleOutlinedIcon fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Your candidate profile is fully complete and optimized.
          </Typography>
        </Stack>
      )}
    </Card>
  );
};

export default ProfileCompletenessCard;

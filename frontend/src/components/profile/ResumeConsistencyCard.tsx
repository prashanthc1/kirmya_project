'use client';

import React from 'react';
import {
  Card,
  Typography,
  Box,
  LinearProgress,
  Stack,
  Chip,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SyncIcon from '@mui/icons-material/Sync';
import { ResumeConsistency } from '../../features/profile/types';

interface ResumeConsistencyCardProps {
  consistency?: ResumeConsistency;
  onSyncSkills?: () => void;
  onReanalyze?: () => void;
}

export const ResumeConsistencyCard: React.FC<ResumeConsistencyCardProps> = ({
  consistency,
  onSyncSkills,
  onReanalyze,
}) => {
  const score = consistency?.overallScore ?? 92;
  const missingSkills = consistency?.missingSkills ?? ['Docker', 'Kubernetes', 'GraphQL'];
  const titleDiscrepancies = consistency?.titleDiscrepancies ?? [
    {
      profileTitle: 'Senior Software Engineer',
      resumeTitle: 'Staff Distributed Systems Engineer',
      discrepancy: 'Job title discrepancy between latest resume version and profile header',
    },
  ];

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
        <Stack direction="row" spacing={1.5} alignItems="center">
          <DescriptionIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Resume & Profile Alignment Score
          </Typography>
        </Stack>
        <Chip
          label={`${score}% Match`}
          color={score >= 85 ? 'success' : score >= 70 ? 'warning' : 'error'}
          sx={{ fontWeight: 900, borderRadius: '10px' }}
        />
      </Stack>

      <Box sx={{ mb: 2.5 }}>
        <LinearProgress
          variant="determinate"
          value={score}
          sx={{
            height: 10,
            borderRadius: 5,
            bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              borderRadius: 5,
              background:
                score >= 85
                  ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
            },
          }}
        />
      </Box>

      {/* Missing Skills Section */}
      {missingSkills.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
            Skills found in uploaded resume but missing from profile:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
            {missingSkills.map((skill) => (
              <Chip
                key={skill}
                label={`+ ${skill}`}
                color="warning"
                variant="outlined"
                size="small"
                sx={{ fontWeight: 700, borderRadius: '8px' }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Title Discrepancies Section */}
      {titleDiscrepancies.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
            Title Discrepancies Detected:
          </Typography>
          <List disablePadding>
            {titleDiscrepancies.map((disc, i) => (
              <ListItem
                key={i}
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: '12px',
                  bgcolor: 'action.hover',
                  mb: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <WarningAmberIcon color="warning" fontSize="small" />
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Profile: &ldquo;{disc.profileTitle}&rdquo; vs Resume: &ldquo;{disc.resumeTitle}&rdquo;
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ ml: 3 }}>
                  {disc.discrepancy}
                </Typography>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      <Stack direction="row" spacing={1.5}>
        <Button
          variant="contained"
          size="small"
          startIcon={<SyncIcon />}
          onClick={onSyncSkills}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800 }}
        >
          Sync Missing Skills
        </Button>
        <Button
          variant="outlined"
          size="small"
          onClick={onReanalyze}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800 }}
        >
          Re-Analyze Resume
        </Button>
      </Stack>
    </Card>
  );
};

export default ResumeConsistencyCard;

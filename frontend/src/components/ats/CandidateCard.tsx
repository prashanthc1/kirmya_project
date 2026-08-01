'use client';

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Avatar,
  Chip,
  IconButton,
  Button,
  Tooltip,
  Checkbox,
  useTheme,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionIcon from '@mui/icons-material/Description';
import MessageIcon from '@mui/icons-material/Message';
import EventIcon from '@mui/icons-material/Event';
import CancelIcon from '@mui/icons-material/Cancel';
import { JobApplicationDTO } from '../../features/ats/types';

interface CandidateCardProps {
  application: JobApplicationDTO;
  onView: (app: JobApplicationDTO) => void;
  onSchedule: (app: JobApplicationDTO) => void;
  onReject: (app: JobApplicationDTO) => void;
  onSelectToggle?: (appId: string, selected: boolean) => void;
  isSelected?: boolean;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  application,
  onView,
  onSchedule,
  onReject,
  onSelectToggle,
  isSelected = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: '14px',
        bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)' },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {onSelectToggle && (
            <Checkbox
              size="small"
              checked={isSelected}
              onChange={(e) => onSelectToggle(application.id, e.target.checked)}
              sx={{ p: 0 }}
            />
          )}
          <Avatar src={application.candidateAvatar} sx={{ width: 44, height: 44, bgcolor: 'primary.main', fontWeight: 800 }}>
            {application.candidateName[0]}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2, cursor: 'pointer' }} onClick={() => onView(application)}>
              {application.candidateName}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {application.candidateHeadline}
            </Typography>
          </Box>
        </Stack>

        <Chip
          icon={<AutoAwesomeIcon sx={{ fontSize: '12px !important', color: '#10b981 !important' }} />}
          label={`${application.aiMatchScore}%`}
          size="small"
          sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 900, fontSize: '0.65rem', height: 20 }}
        />
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <LocationOnIcon fontSize="small" color="primary" sx={{ fontSize: 14 }} />
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            {application.candidateLocation}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <WorkIcon fontSize="small" color="action" sx={{ fontSize: 14 }} />
          <Typography variant="caption" color="text.secondary">
            {application.experienceYears} Yrs Exp
          </Typography>
        </Box>
      </Stack>

      {/* Skills */}
      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mb: 1.5, gap: 0.5 }}>
        {application.skills.slice(0, 3).map((sk) => (
          <Chip key={sk} label={sk} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 18 }} />
        ))}
      </Stack>

      {/* Footer Info */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 1, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
          Assigned: <strong>{application.assignedRecruiter}</strong>
        </Typography>

        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View Candidate Profile & Timeline">
            <IconButton size="small" onClick={() => onView(application)}>
              <VisibilityIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Schedule Interview">
            <IconButton size="small" color="primary" onClick={() => onSchedule(application)}>
              <EventIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reject Application">
            <IconButton size="small" color="error" onClick={() => onReject(application)}>
              <CancelIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
    </Paper>
  );
};

export default CandidateCard;

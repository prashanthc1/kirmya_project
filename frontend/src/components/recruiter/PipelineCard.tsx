'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  Avatar,
  Chip,
  IconButton,
  Stack,
  MenuItem,
  Menu,
  useTheme,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EventIcon from '@mui/icons-material/Event';

export interface PipelineCandidate {
  id: string;
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateHeadline: string;
  candidateAvatar: string;
  matchScore: number;
  stage: string;
  appliedDate: string;
  interviewScheduledAt?: string;
  notes?: string;
}

interface Props {
  candidate: PipelineCandidate;
  onMoveStage: (candidateId: string, targetStage: string) => void;
  onViewDetails: (candidate: PipelineCandidate) => void;
  stages: string[];
}

export const PipelineCard: React.FC<Props> = ({ candidate, onMoveStage, onViewDetails, stages }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <Card
      onClick={() => onViewDetails(candidate)}
      sx={{
        p: 2,
        borderRadius: '16px',
        bgcolor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.06)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 12px 24px rgba(99, 102, 241, 0.15)',
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar src={candidate.candidateAvatar} sx={{ width: 42, height: 42, borderRadius: '12px' }}>
            {candidate.candidateName[0]}
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              {candidate.candidateName}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
              Applied {candidate.appliedDate}
            </Typography>
          </Box>
        </Stack>

        <IconButton size="small" onClick={handleOpenMenu}>
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <Chip
          icon={<AutoAwesomeIcon sx={{ fontSize: '12px !important' }} />}
          label={`${candidate.matchScore}% MATCH`}
          size="small"
          color="primary"
          sx={{ fontWeight: 900, fontSize: '0.65rem', height: 20 }}
        />
        {candidate.interviewScheduledAt && (
          <Chip
            icon={<EventIcon sx={{ fontSize: '12px !important' }} />}
            label="Interview Set"
            size="small"
            color="success"
            sx={{ fontWeight: 800, fontSize: '0.65rem', height: 20 }}
          />
        )}
      </Stack>

      {candidate.notes && (
        <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {candidate.notes}
        </Typography>
      )}

      {/* Stage Move Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <Typography variant="caption" sx={{ px: 2, py: 0.5, fontWeight: 800, color: 'text.secondary', display: 'block' }}>
          Move Candidate Stage:
        </Typography>
        {stages.map((st) => (
          <MenuItem
            key={st}
            disabled={st === candidate.stage}
            onClick={(e) => {
              e.stopPropagation();
              onMoveStage(candidate.id, st);
              handleClose();
            }}
            sx={{ fontSize: '0.85rem', fontWeight: 700 }}
          >
            Move to {st}
          </MenuItem>
        ))}
      </Menu>
    </Card>
  );
};

export default PipelineCard;

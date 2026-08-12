'use client';

import React, { useState } from 'react';
import { surfaceTransition } from '../../theme/motion';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import SendIcon from '@mui/icons-material/Send';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VerifiedIcon from '@mui/icons-material/Verified';
import BusinessIcon from '@mui/icons-material/Business';

import { JobRecommendation } from '@/features/job-alerts/types';
import { MatchScoreIndicator } from './MatchScoreIndicator';

interface RecommendationCardProps {
  recommendation: JobRecommendation;
  onApply?: (rec: JobRecommendation) => void;
  onSaveToggle?: (rec: JobRecommendation) => void;
  onViewDetails?: (rec: JobRecommendation) => void;
  onFeedback?: (rec: JobRecommendation, action: string, reason?: string) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onApply,
  onSaveToggle,
  onViewDetails,
  onFeedback,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleSelectFeedback = (action: string) => {
    if (onFeedback) {
      onFeedback(recommendation, action);
    }
    handleCloseMenu();
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        transition: surfaceTransition(0.25),
        '&:hover': {
          borderColor: 'rgba(153, 51, 255, 0.4)',
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Avatar src={recommendation.company_logo} variant="rounded" sx={{ width: 52, height: 52, borderRadius: 2 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.2 }}>
              {recommendation.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {recommendation.company_name}
              </Typography>
              {recommendation.company_verified && <VerifiedIcon sx={{ color: '#00CC66', fontSize: 16 }} />}
            </Box>
          </Box>
        </Box>

        <MatchScoreIndicator score={recommendation.score.overall_score} size={48} />
      </Box>

      <Typography variant="body2" sx={{ color: 'primary.light', fontWeight: 600, mb: 1.5 }}>
        {recommendation.score.match_reasons[0]}
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
          <LocationOnIcon fontSize="small" sx={{ color: 'primary.main', fontSize: 16 }} />
          <Typography variant="caption">{recommendation.location}</Typography>
        </Box>
        <Typography variant="caption" sx={{ color: '#00CC66', fontWeight: 700 }}>
          {recommendation.salary_range}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {recommendation.salary_comparison}
        </Typography>
      </Stack>

      <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 2.5 }}>
        {recommendation.score.matching_skills.slice(0, 4).map((s) => (
          <Chip key={s} label={s} size="small" sx={{ bgcolor: 'rgba(0, 102, 255, 0.12)', color: 'primary.main', fontWeight: 600, fontSize: '0.72rem' }} />
        ))}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <Stack direction="row" spacing={1}>
          {onViewDetails && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={() => onViewDetails(recommendation)}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Why Matched?
            </Button>
          )}
          {onApply && (
            <Button
              size="small"
              variant="contained"
              endIcon={<SendIcon />}
              onClick={() => onApply(recommendation)}
              disabled={recommendation.is_applied}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            >
              {recommendation.is_applied ? 'Applied' : 'Apply Now'}
            </Button>
          )}
        </Stack>

        <Stack direction="row" spacing={0.5}>
          {onSaveToggle && (
            <IconButton size="small" onClick={() => onSaveToggle(recommendation)} sx={{ color: recommendation.is_saved ? '#FF9900' : 'text.secondary' }}>
              {recommendation.is_saved ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
            </IconButton>
          )}
          <IconButton size="small" onClick={handleOpenMenu} sx={{ color: 'text.secondary' }}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        <MenuItem onClick={() => handleSelectFeedback('interested')}>
          <ListItemIcon><CheckCircleIcon fontSize="small" color="success" /></ListItemIcon>
          <ListItemText>Interested in roles like this</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleSelectFeedback('not_interested')}>
          <ListItemIcon><ThumbDownIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Not Interested</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleSelectFeedback('hide_company')}>
          <ListItemIcon><BusinessIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Hide Company ({recommendation.company_name})</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleSelectFeedback('too_senior')}>
          <ListItemText>Role is Too Senior</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleSelectFeedback('too_junior')}>
          <ListItemText>Role is Too Junior</ListItemText>
        </MenuItem>
      </Menu>
    </Paper>
  );
};

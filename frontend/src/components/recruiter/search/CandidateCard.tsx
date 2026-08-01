'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  Avatar,
  IconButton,
  Paper,
  Checkbox,
  Tooltip,
  useTheme,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import MessageIcon from '@mui/icons-material/Message';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SendIcon from '@mui/icons-material/Send';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GlassCard from '../../landing/GlassCard';
import { CandidateSearchResultItem } from '../../../features/recruiter/search/types';
import { candidateSearchApi } from '../../../features/recruiter/search/api';

interface CandidateCardProps {
  candidate: CandidateSearchResultItem;
  onPreview: (candidate: CandidateSearchResultItem) => void;
  onAddToPool: (candidate: CandidateSearchResultItem) => void;
  onCompareToggle: (candidate: CandidateSearchResultItem, selected: boolean) => void;
  isCompared?: boolean;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onPreview,
  onAddToPool,
  onCompareToggle,
  isCompared = false,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [saved, setSaved] = useState(candidate.saved || false);
  const [contacted, setContacted] = useState(candidate.contacted || false);

  const toggleSave = async () => {
    try {
      if (saved) {
        await candidateSearchApi.unsaveCandidate(candidate.id);
      } else {
        await candidateSearchApi.saveCandidate(candidate.id);
      }
      setSaved(!saved);
    } catch {
      setSaved(!saved);
    }
  };

  const handleConnect = async () => {
    try {
      await candidateSearchApi.connectCandidate(candidate.id);
      setContacted(true);
    } catch {
      setContacted(true);
    }
  };

  return (
    <GlassCard sx={{ p: 3, mb: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} justifyContent="space-between" alignItems="flex-start">
        {/* Left Info Column */}
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Tooltip title="Select to compare candidate side-by-side">
            <Checkbox
              checked={isCompared}
              onChange={(e) => onCompareToggle(candidate, e.target.checked)}
              sx={{ p: 0, mt: 0.5 }}
            />
          </Tooltip>

          <Avatar
            src={candidate.avatarUrl}
            sx={{ width: 60, height: 60, bgcolor: 'primary.main', fontWeight: 800, fontSize: '1.5rem' }}
          >
            {candidate.name[0]}
          </Avatar>

          <Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 900, cursor: 'pointer' }} onClick={() => onPreview(candidate)}>
                {candidate.name}
              </Typography>

              <Chip
                icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important', color: '#10b981 !important' }} />}
                label={`${candidate.aiMatch.overallScore}% AI MATCH`}
                size="small"
                sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 900, fontSize: '0.7rem' }}
              />

              {candidate.openToWork && (
                <Chip label="OPEN TO WORK" size="small" color="success" sx={{ fontSize: '0.65rem', fontWeight: 800, height: 20 }} />
              )}
            </Stack>

            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
              {candidate.headline}
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <WorkIcon fontSize="small" color="action" />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {candidate.currentPosition} at {candidate.company}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOnIcon fontSize="small" color="primary" />
                <Typography variant="caption" color="text.secondary">
                  {candidate.location} • {candidate.yearsExperience} Yrs Exp
                </Typography>
              </Box>
            </Stack>

            {/* Top Skill Chips */}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
              {candidate.skills.slice(0, 6).map((sk) => (
                <Chip key={sk} label={sk} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
              ))}
            </Stack>

            {/* AI Summary Note */}
            <Paper
              elevation={0}
              sx={{
                p: 1.2,
                borderRadius: '10px',
                bgcolor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <AutoAwesomeIcon fontSize="small" /> {candidate.aiMatch.summaryNote}
              </Typography>
            </Paper>
          </Box>
        </Stack>

        {/* Right Action Column */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ pt: { xs: 2, md: 0 } }}>
          <IconButton onClick={toggleSave} color={saved ? 'warning' : 'default'}>
            {saved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
          </IconButton>

          <Button
            variant="outlined"
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={() => onPreview(candidate)}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
          >
            Quick View
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<FolderSpecialIcon />}
            onClick={() => onAddToPool(candidate)}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
          >
            Pool
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<MessageIcon />}
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 800 }}
          >
            Message
          </Button>
        </Stack>
      </Stack>
    </GlassCard>
  );
};

export default CandidateCard;

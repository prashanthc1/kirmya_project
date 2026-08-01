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
  useTheme,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import MessageIcon from '@mui/icons-material/Message';
import DescriptionIcon from '@mui/icons-material/Description';
import GlassCard from '../landing/GlassCard';
import { RecruiterCandidateItem } from '../../features/recruiter/types';
import { recruiterApi } from '../../features/recruiter/api';

interface CandidateCardProps {
  candidate: RecruiterCandidateItem;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({ candidate }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [saved, setSaved] = useState(candidate.saved || false);

  const toggleSave = async () => {
    try {
      await recruiterApi.saveCandidate(candidate.id);
      setSaved(!saved);
    } catch {
      setSaved(!saved);
    }
  };

  return (
    <GlassCard sx={{ p: 3, mb: 3 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems="flex-start" justifyContent="space-between">
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontSize: '1.6rem', fontWeight: 800 }}>
            {candidate.name[0]}
          </Avatar>

          <Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                {candidate.name}
              </Typography>
              <Chip
                icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important', color: '#10b981 !important' }} />}
                label={`${candidate.matchScore}% MATCH`}
                size="small"
                sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 900, fontSize: '0.7rem' }}
              />
            </Stack>

            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
              {candidate.headline}
            </Typography>

            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOnIcon fontSize="small" color="primary" />
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  {candidate.location}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <WorkIcon fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  {candidate.experienceYears} Years Exp • {candidate.availability}
                </Typography>
              </Box>
            </Stack>

            {/* Skills */}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
              {candidate.skills.map((sk) => (
                <Chip key={sk} label={sk} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
              ))}
            </Stack>

            {/* AI Recommendation Note */}
            <Paper
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: '12px',
                bgcolor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                <AutoAwesomeIcon fontSize="small" /> {candidate.recommendationNote}
              </Typography>
            </Paper>
          </Box>
        </Stack>

        {/* Actions */}
        <Stack direction="row" spacing={1} sx={{ pt: { xs: 2, sm: 0 } }}>
          <IconButton onClick={toggleSave} color={saved ? 'warning' : 'default'}>
            {saved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
          </IconButton>

          <Button
            variant="outlined"
            size="small"
            startIcon={<DescriptionIcon />}
            component="a"
            href={candidate.resumeUrl}
            target="_blank"
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
          >
            Resume
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

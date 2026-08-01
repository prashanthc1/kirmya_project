'use client';

import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  Stack,
  Avatar,
  Chip,
  Button,
  IconButton,
  Divider,
  Paper,
  LinearProgress,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import DescriptionIcon from '@mui/icons-material/Description';
import MessageIcon from '@mui/icons-material/Message';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { CandidateSearchResultItem } from '../../../features/recruiter/search/types';

interface CandidatePreviewDrawerProps {
  open: boolean;
  onClose: () => void;
  candidate?: CandidateSearchResultItem | null;
}

export const CandidatePreviewDrawer: React.FC<CandidatePreviewDrawerProps> = ({ open, onClose, candidate }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!candidate) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 480, md: 540 }, p: 0 } }}>
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 900 }}>
          Candidate Quick Profile Preview
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 3, overflowY: 'auto', flexGrow: 1 }}>
        {/* Candidate Header */}
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Avatar src={candidate.avatarUrl} sx={{ width: 64, height: 64, bgcolor: 'primary.main', fontWeight: 800, fontSize: '1.5rem' }}>
            {candidate.name[0]}
          </Avatar>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 900 }}>
                {candidate.name}
              </Typography>
              <Chip
                icon={<AutoAwesomeIcon sx={{ fontSize: '14px !important', color: '#10b981 !important' }} />}
                label={`${candidate.aiMatch.overallScore}% MATCH`}
                size="small"
                sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 900 }}
              />
            </Stack>
            <Typography variant="subtitle2" color="text.secondary">
              {candidate.headline}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {candidate.location} • {candidate.yearsExperience} Years Experience
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
          <Button variant="contained" fullWidth startIcon={<MessageIcon />} sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none' }}>
            Message Candidate
          </Button>
          <Button variant="outlined" startIcon={<DescriptionIcon />} component="a" href={candidate.resumeUrl} target="_blank" sx={{ borderRadius: '10px', fontWeight: 700 }}>
            Resume
          </Button>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        {/* AI Match Insights */}
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesomeIcon /> AI Fit &amp; Match Analysis
        </Typography>

        <Paper elevation={0} sx={{ p: 2, borderRadius: '14px', bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)', mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
            Matching Required Skills:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            {candidate.aiMatch.matchingSkills.map((sk) => (
              <Chip key={sk} label={sk} size="small" color="success" icon={<CheckCircleIcon fontSize="small" />} sx={{ fontWeight: 700 }} />
            ))}
          </Stack>

          {candidate.aiMatch.missingSkills.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                Skill Gaps / Missing:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                {candidate.aiMatch.missingSkills.map((sk) => (
                  <Chip key={sk} label={sk} size="small" color="error" icon={<CancelIcon fontSize="small" />} sx={{ fontWeight: 700 }} />
                ))}
              </Stack>
            </>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontWeight: 600 }}>
            • Experience Alignment: {candidate.aiMatch.experienceAlignment}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>
            • Location Match: {candidate.aiMatch.locationCompatibility}
          </Typography>
        </Paper>

        {/* Work History */}
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <WorkIcon fontSize="small" /> Current &amp; Previous Positions
        </Typography>

        <Paper elevation={0} sx={{ p: 2, borderRadius: '14px', bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)', mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            {candidate.currentPosition}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            {candidate.company} • 2021 - Present
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
            Responsible for core systems design, REST microservices development, PostgreSQL query optimizations, and team mentorship.
          </Typography>
        </Paper>

        {/* Education & Certifications */}
        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SchoolIcon fontSize="small" /> Education &amp; Certifications
        </Typography>

        <Paper elevation={0} sx={{ p: 2, borderRadius: '14px', bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)', mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            {candidate.educationDegree}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
            {candidate.certifications.map((cert) => (
              <Chip key={cert} label={cert} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
            ))}
          </Stack>
        </Paper>
      </Box>
    </Drawer>
  );
};

export default CandidatePreviewDrawer;

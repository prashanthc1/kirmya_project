'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Stack,
  Button,
  Divider,
  useTheme,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SchoolIcon from '@mui/icons-material/School';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

interface SkillGapBridgeProps {
  targetRole: string;
  matchedSkills: string[];
  missingSkills: string[];
  transferableSkills?: string[];
  actionItems?: string[];
  onCourseClick?: (courseName: string) => void;
}

export const SkillGapBridge: React.FC<SkillGapBridgeProps> = ({
  targetRole,
  matchedSkills,
  missingSkills,
  transferableSkills = [],
  actionItems = [],
  onCourseClick,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        background: isDark
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary', display: 'flex', alignItems: 'center', gap: 1 }}>
              <AutoAwesomeIcon sx={{ color: 'primary.main', fontSize: 22 }} />
              Skill Bridge Matrix: {targetRole}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Comparing your profile capabilities against active hiring market requirements.
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2.5, borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }} />

        {/* Skills Columns */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Matched Skills */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                height: '100%',
                bgcolor: isDark ? 'rgba(34, 197, 94, 0.06)' : 'rgba(34, 197, 94, 0.05)',
                border: '1px solid',
                borderColor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)',
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: isDark ? '#4ade80' : '#15803d', mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <CheckCircleIcon fontSize="small" />
                VERIFIED SKILLS ({matchedSkills.length})
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {matchedSkills.map((s, idx) => (
                  <Chip
                    key={idx}
                    label={s}
                    size="small"
                    sx={{
                      bgcolor: isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)',
                      color: isDark ? '#4ade80' : '#166534',
                      fontWeight: 600,
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Grid>

          {/* Missing Gap Skills */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                height: '100%',
                bgcolor: isDark ? 'rgba(244, 63, 94, 0.06)' : 'rgba(244, 63, 94, 0.05)',
                border: '1px solid',
                borderColor: isDark ? 'rgba(244, 63, 94, 0.2)' : 'rgba(244, 63, 94, 0.15)',
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: isDark ? '#fb7185' : '#be123c', mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <SchoolIcon fontSize="small" />
                SKILLS TO ACQUIRE ({missingSkills.length})
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {missingSkills.map((s, idx) => (
                  <Chip
                    key={idx}
                    label={`+ ${s}`}
                    size="small"
                    onClick={() => onCourseClick && onCourseClick(s)}
                    sx={{
                      bgcolor: isDark ? 'rgba(244, 63, 94, 0.2)' : 'rgba(244, 63, 94, 0.15)',
                      color: isDark ? '#fda4af' : '#9f1239',
                      fontWeight: 600,
                      cursor: onCourseClick ? 'pointer' : 'default',
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Grid>

          {/* Transferable Skills */}
          <Grid item xs={12} md={4}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                height: '100%',
                bgcolor: isDark ? 'rgba(168, 85, 247, 0.06)' : 'rgba(168, 85, 247, 0.05)',
                border: '1px solid',
                borderColor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.15)',
              }}
            >
              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: isDark ? '#c084fc' : '#7e22ce', mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <CompareArrowsIcon fontSize="small" />
                ADJACENT & TRANSFERABLE
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {transferableSkills.map((s, idx) => (
                  <Chip
                    key={idx}
                    label={s}
                    size="small"
                    sx={{
                      bgcolor: isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.15)',
                      color: isDark ? '#e9d5ff' : '#6b21a8',
                      fontWeight: 600,
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Grid>
        </Grid>

        {/* Actionable Steps */}
        {actionItems.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" fontWeight="bold" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
              RECOMMENDED FAST-TRACK ACTION ITEMS
            </Typography>
            <Stack spacing={1}>
              {actionItems.map((act, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <AutoAwesomeIcon sx={{ color: 'primary.main', fontSize: 18 }} />
                  <Typography variant="body2" sx={{ color: 'text.primary', flexGrow: 1 }}>
                    {act}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SkillGapBridge;

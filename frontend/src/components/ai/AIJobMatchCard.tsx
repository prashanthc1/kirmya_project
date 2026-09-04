'use client';

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Button,
  Grid,
  Stack,
  Divider,
  useTheme,
  Tooltip,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SchoolIcon from '@mui/icons-material/School';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { AIJobMatch } from '@/features/ai_job_match/types';

interface AIJobMatchCardProps {
  match: AIJobMatch;
  onApply?: (jobID: string) => void;
  onViewJob?: (jobID: string) => void;
  onUpskillClick?: (actionURL: string) => void;
}

export const AIJobMatchCard: React.FC<AIJobMatchCardProps> = ({
  match,
  onApply,
  onViewJob,
  onUpskillClick,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const getTierColor = (score: number) => {
    if (score >= 85) return theme.palette.success.main;
    if (score >= 70) return theme.palette.primary.main;
    return theme.palette.warning.main;
  };

  const scoreColor = getTierColor(match.overall_score);

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
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isDark
            ? '0 12px 24px -10px rgba(0, 0, 0, 0.5)'
            : '0 12px 24px -10px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header: Title, Company, Match Badge */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary', mb: 0.5 }}>
              {match.job_title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {match.company_name}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h5" fontWeight="bold" sx={{ color: scoreColor }}>
                {match.overall_score}%
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Match Score
              </Typography>
            </Box>
            <Chip
              icon={<AutoAwesomeIcon sx={{ fontSize: '1rem !important' }} />}
              label={match.match_tier.replace('_', ' ').toUpperCase()}
              size="small"
              sx={{
                fontWeight: 600,
                bgcolor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(14, 165, 233, 0.15)',
                color: isDark ? '#38bdf8' : '#0284c7',
                border: '1px solid',
                borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(14, 165, 233, 0.3)',
              }}
            />
          </Box>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ mb: 2.5 }}>
          <LinearProgress
            variant="determinate"
            value={match.overall_score}
            aria-label={`Match score: ${match.overall_score} percent`}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
              '& .MuiLinearProgress-bar': {
                bgcolor: scoreColor,
                borderRadius: 3,
              },
            }}
          />
        </Box>

        {/* Explainability Callout */}
        <Box
          sx={{
            p: 1.75,
            mb: 2.5,
            borderRadius: 2,
            bgcolor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(241, 245, 249, 0.7)',
            borderLeft: `4px solid ${scoreColor}`,
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.5 }}>
            {match.explanation}
          </Typography>
        </Box>

        <Divider sx={{ my: 2, borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)' }} />

        {/* Skills Alignment Grid */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {/* Matched Skills */}
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" fontWeight="bold" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 16 }} />
              MATCHED SKILLS ({match.matched_skills?.length || 0})
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {match.matched_skills?.map((skill, idx) => (
                <Chip
                  key={idx}
                  label={skill}
                  size="small"
                  sx={{
                    bgcolor: isDark ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.1)',
                    color: isDark ? '#4ade80' : '#15803d',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}
                />
              ))}
            </Stack>
          </Grid>

          {/* Missing / Gap Skills */}
          <Grid item xs={12} sm={6}>
            <Typography variant="caption" fontWeight="bold" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <HelpOutlineIcon sx={{ color: 'warning.main', fontSize: 16 }} />
              SKILLS TO BRIDGE ({match.missing_skills?.length || 0})
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {match.missing_skills?.map((skill, idx) => (
                <Chip
                  key={idx}
                  label={skill}
                  size="small"
                  sx={{
                    bgcolor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.1)',
                    color: isDark ? '#fbbf24' : '#b45309',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}
                />
              ))}
            </Stack>
          </Grid>
        </Grid>

        {/* Recommended Upskilling Actions */}
        {match.recommended_actions && match.recommended_actions.length > 0 && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="caption" fontWeight="bold" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <SchoolIcon sx={{ color: 'primary.main', fontSize: 16 }} />
              RECOMMENDED UPSKILLING ACTIONS
            </Typography>
            <Stack spacing={1}>
              {match.recommended_actions.map((act, idx) => (
                <Box
                  key={idx}
                  sx={{
                    p: 1.25,
                    borderRadius: 1.5,
                    bgcolor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Box>
                    <Typography variant="body2" fontWeight="600" sx={{ color: 'text.primary' }}>
                      {act.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {act.description}
                    </Typography>
                  </Box>
                  {act.action_url && (
                    <Button
                      size="small"
                      variant="text"
                      endIcon={<ArrowForwardIcon fontSize="small" />}
                      onClick={() => onUpskillClick && onUpskillClick(act.action_url)}
                      sx={{ textTransform: 'none', fontWeight: 600, minWidth: 'auto' }}
                    >
                      Start
                    </Button>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 3 }}>
          {onViewJob && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => onViewJob(match.job_id)}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
            >
              View Job
            </Button>
          )}
          {onApply && (
            <Button
              variant="contained"
              size="small"
              onClick={() => onApply(match.job_id)}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              }}
            >
              Apply Now
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AIJobMatchCard;

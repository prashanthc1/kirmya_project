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
  useTheme,
  Paper,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import { ResumeAnalysis } from '@/features/resume_analysis/types';

interface ResumeAnalysisViewProps {
  analysis: ResumeAnalysis;
}

export const ResumeAnalysisView: React.FC<ResumeAnalysisViewProps> = ({ analysis }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const scores = analysis.scores || {
    overall_score: 85,
    ats_compatibility_score: 88,
    structure_score: 85,
    skills_score: 90,
    experience_score: 82,
    job_match_score: 84,
  };

  const improvements = analysis.improvements || {
    keyword_density_score: 80,
    present_keywords: [],
    missing_keywords: [],
    experience_bullet_fixes: [],
    general_suggestions: [],
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return theme.palette.success.main;
    if (score >= 70) return theme.palette.primary.main;
    return theme.palette.warning.main;
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Top Scores Header Banner */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Overall Score */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              background: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(12px)',
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              OVERALL RATING
            </Typography>
            <Typography variant="h3" fontWeight="bold" sx={{ color: getScoreColor(scores.overall_score), my: 0.5 }}>
              {scores.overall_score}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              out of 100
            </Typography>
          </Paper>
        </Grid>

        {/* ATS Compatibility */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              background: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(12px)',
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              ATS COMPATIBILITY
            </Typography>
            <Typography variant="h3" fontWeight="bold" sx={{ color: getScoreColor(scores.ats_compatibility_score), my: 0.5 }}>
              {scores.ats_compatibility_score}%
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Parser Readability
            </Typography>
          </Paper>
        </Grid>

        {/* Structure & Layout */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              background: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(12px)',
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              STRUCTURE SCORE
            </Typography>
            <Typography variant="h3" fontWeight="bold" sx={{ color: getScoreColor(scores.structure_score), my: 0.5 }}>
              {scores.structure_score}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Formatting Standard
            </Typography>
          </Paper>
        </Grid>

        {/* Keyword Density */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: '1px solid',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
              background: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(12px)',
              textAlign: 'center',
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              KEYWORD DENSITY
            </Typography>
            <Typography variant="h3" fontWeight="bold" sx={{ color: getScoreColor(improvements.keyword_density_score), my: 0.5 }}>
              {improvements.keyword_density_score}%
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Target Role Relevance
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Keywords Breakdown */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'text.primary', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            Keyword Analysis & Match Density
          </Typography>

          <Grid container spacing={3}>
            {/* Present Keywords */}
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" fontWeight="bold" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                DETECTED ATS KEYWORDS ({improvements.present_keywords?.length || 0})
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {improvements.present_keywords?.map((kw: string, idx: number) => (
                  <Chip
                    key={idx}
                    label={kw}
                    size="small"
                    sx={{
                      bgcolor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)',
                      color: isDark ? '#4ade80' : '#166534',
                      fontWeight: 600,
                    }}
                  />
                ))}
              </Stack>
            </Grid>

            {/* Missing Keywords */}
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" fontWeight="bold" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                RECOMMENDED KEYWORDS TO ADD ({improvements.missing_keywords?.length || 0})
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {improvements.missing_keywords?.map((kw: string, idx: number) => (
                  <Chip
                    key={idx}
                    label={`+ ${kw}`}
                    size="small"
                    sx={{
                      bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
                      color: isDark ? '#fbbf24' : '#92400e',
                      fontWeight: 600,
                    }}
                  />
                ))}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Experience Bullet Rewrites */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
          background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'text.primary', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormatQuoteIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            Action-Oriented Experience Bullet Recommendations
          </Typography>

          <Stack spacing={1.5}>
            {improvements.experience_bullet_fixes?.map((fix: string, idx: number) => (
              <Box
                key={idx}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: isDark ? 'rgba(0, 0, 0, 0.25)' : 'rgba(241, 245, 249, 0.7)',
                  borderLeft: `4px solid ${theme.palette.primary.main}`,
                }}
              >
                <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6 }}>
                  {fix}
                </Typography>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* General Suggestions & Format Tips */}
      {improvements.general_suggestions && improvements.general_suggestions.length > 0 && (
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
            background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'text.primary', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 20 }} />
              Best-Practice Layout & Delivery Suggestions
            </Typography>

            <Stack spacing={1}>
              {improvements.general_suggestions.map((sug: string, idx: number) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <CheckCircleOutlineIcon sx={{ color: 'success.main', fontSize: 18, mt: 0.25 }} />
                  <Typography variant="body2" sx={{ color: 'text.primary' }}>
                    {sug}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ResumeAnalysisView;

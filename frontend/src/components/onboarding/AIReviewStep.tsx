'use client';

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Stack,
  Chip,
  Paper,
  LinearProgress,
  useTheme,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { motion } from 'framer-motion';
import { springs } from '../../theme/motion';
import GlassCard from '../landing/GlassCard';

interface StepProps {
  onNext: () => void;
  onPrev: () => void;
}

export const AIReviewStep: React.FC<StepProps> = ({ onNext, onPrev }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const metrics = [
    { label: 'Profile Completion', score: 92, color: '#10b981' },
    { label: 'Resume ATS Score', score: 88, color: '#6366f1' },
    { label: 'Skill Match Rating', score: 90, color: '#ec4899' },
    { label: 'Market Demand', score: 94, color: '#f59e0b' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={springs.entrance}>
      <GlassCard sx={{ p: { xs: 3, md: 5 } }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <AutoAwesomeIcon sx={{ color: '#a855f7', fontSize: 32 }} />
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            AI Profile Review &amp; Insights
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Comprehensive neural analysis of your profile, resume ATS readiness, and market demand positioning.
        </Typography>

        {/* 4 Score Meters */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {metrics.map((m, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 900, color: m.color, mb: 0.5 }}>
                  {m.score}%
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.primary', display: 'block', mb: 1 }}>
                  {m.label}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={m.score}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': { bgcolor: m.color, borderRadius: 3 },
                  }}
                />
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Insights Section */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '16px',
            bgcolor: 'rgba(168, 85, 247, 0.08)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            mb: 4,
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#a855f7', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon /> AI Strategic Recommendations
          </Typography>

          <Stack spacing={1.5}>
            {[
              'High market demand detected for Facilities Operations & Vendor Management in UAE & KSA.',
              'Recommended missing skill: Add SLA Auditing & Facility Automation to reach 98% match rate.',
              'Resume ATS check passed: High formatting compliance for corporate ATS screeners.',
            ].map((rec, idx) => (
              <Stack direction="row" spacing={1.5} alignItems="center" key={idx}>
                <CheckCircleOutlineIcon sx={{ color: '#10b981', fontSize: 20 }} />
                <Typography variant="body2" sx={{ lineHeight: 1.5, fontWeight: 500 }}>
                  {rec}
                </Typography>
              </Stack>
            ))}
          </Stack>

          <Box sx={{ mt: 2.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 1 }}>
              Recommended Missing Skills To Add:
            </Typography>
            <Stack direction="row" spacing={1}>
              <Chip label="+ SLA Auditing" size="small" color="secondary" />
              <Chip label="+ Facility Automation" size="small" color="secondary" />
              <Chip label="+ HVAC Systems" size="small" color="secondary" />
            </Stack>
          </Box>
        </Paper>

        <Stack direction="row" justifyContent="space-between">
          <Button variant="text" onClick={onPrev} startIcon={<ArrowBackIcon />} sx={{ fontWeight: 700 }}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={onNext}
            endIcon={<ArrowForwardIcon />}
            sx={{
              py: 1.2,
              px: 4,
              borderRadius: '12px',
              fontWeight: 800,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
            }}
          >
            Review &amp; Finalize
          </Button>
        </Stack>
      </GlassCard>
    </motion.div>
  );
};

export default AIReviewStep;

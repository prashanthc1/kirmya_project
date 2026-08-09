'use client';

import React from 'react';
import { Paper, Box, Typography, Stack, Grid, Chip, Divider } from '@mui/material';
import { Assessment, CheckCircle, Lightbulb, AutoAwesome, TrendingUp } from '@mui/icons-material';
import { MockInterviewAnswer } from '@/features/interview-prep/types';

interface MockFeedbackReportProps {
  answer: MockInterviewAnswer;
}

export const MockFeedbackReport: React.FC<MockFeedbackReportProps> = ({ answer }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        color: '#fff',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <AutoAwesome sx={{ color: '#60A5FA' }} />
          <Typography variant="h6" fontWeight={700}>
            AI Multi-Metric Answer Evaluation
          </Typography>
        </Stack>
        <Chip
          label={`Overall Score: ${answer.overall_score}/100`}
          sx={{
            bgcolor: 'rgba(59, 130, 246, 0.2)',
            color: '#60A5FA',
            fontWeight: 800,
            fontSize: '0.95rem',
            py: 0.5,
            px: 1,
          }}
        />
      </Stack>

      {/* 6 Criteria Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Relevance to Question', score: answer.relevance_score, color: '#60A5FA' },
          { label: 'Clarity & Delivery', score: answer.clarity_score, color: '#34D399' },
          { label: 'Technical Depth', score: answer.technical_score, color: '#FBBF24' },
          { label: 'Communication Cadence', score: answer.communication_score, color: '#A78BFA' },
          { label: 'STAR Framework Compliance', score: answer.structure_score, color: '#F472B6' },
          { label: 'Confidence Rating', score: answer.confidence_score, color: '#38BDF8' },
        ].map((item, idx) => (
          <Grid item xs={6} sm={4} key={idx}>
            <Box sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, display: 'block', mb: 0.5 }}>
                {item.label}
              </Typography>
              <Typography variant="h6" fontWeight={800} sx={{ color: item.color }}>
                {item.score}%
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* STAR Detection Check */}
      <Box sx={{ mb: 3, p: 2, borderRadius: 2.5, bgcolor: 'rgba(30, 41, 59, 0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <Typography variant="caption" fontWeight={700} sx={{ color: '#CBD5E1', display: 'block', mb: 1 }}>
          STAR METHOD COMPONENT DETECTED
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
          <Chip label="Situation" color={answer.has_star_situation ? 'success' : 'default'} size="small" variant={answer.has_star_situation ? 'filled' : 'outlined'} />
          <Chip label="Task" color={answer.has_star_task ? 'success' : 'default'} size="small" variant={answer.has_star_task ? 'filled' : 'outlined'} />
          <Chip label="Action" color={answer.has_star_action ? 'success' : 'default'} size="small" variant={answer.has_star_action ? 'filled' : 'outlined'} />
          <Chip label="Result" color={answer.has_star_result ? 'success' : 'default'} size="small" variant={answer.has_star_result ? 'filled' : 'outlined'} />
        </Stack>
      </Box>

      {/* Feedback Sections */}
      <Stack spacing={2}>
        {answer.what_went_well && (
          <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <CheckCircle sx={{ color: '#34D399', fontSize: '1.1rem' }} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#34D399' }}>
                What Went Well
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
              {answer.what_went_well}
            </Typography>
          </Box>
        )}

        {answer.what_could_improve && (
          <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <TrendingUp sx={{ color: '#FBBF24', fontSize: '1.1rem' }} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#FBBF24' }}>
                Areas for Improvement
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
              {answer.what_could_improve}
            </Typography>
          </Box>
        )}

        {answer.suggested_answer && (
          <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
              <Lightbulb sx={{ color: '#60A5FA', fontSize: '1.1rem' }} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#60A5FA' }}>
                AI Suggested Benchmark Response
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: '#E2E8F0', fontStyle: 'italic' }}>
              &quot;{answer.suggested_answer}&quot;
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

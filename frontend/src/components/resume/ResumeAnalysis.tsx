'use client';

import React from 'react';
import { Paper, Box, Typography, Stack, Alert, Chip } from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { ATSAnalysis } from '@/features/resume/types';

export const ResumeAnalysis: React.FC<{ analysis: ATSAnalysis }> = ({ analysis }) => {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <SpeedIcon sx={{ color: 'primary.main', fontSize: 28 }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Deep ATS Parsing & Keyword Analysis
        </Typography>
      </Box>

      {analysis.parsingIssues.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningAmberIcon sx={{ color: '#FF9900' }} /> Potential Parsing Issues ({analysis.parsingIssues.length})
          </Typography>
          <Stack spacing={1}>
            {analysis.parsingIssues.map((issue, idx) => (
              <Alert key={idx} severity="warning" sx={{ borderRadius: 2 }}>
                {issue}
              </Alert>
            ))}
          </Stack>
        </Box>
      )}

      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleOutlineIcon sx={{ color: '#00CC66' }} /> AI Recommendations ({analysis.recommendations.length})
        </Typography>
        <Stack spacing={1}>
          {analysis.recommendations.map((rec, idx) => (
            <Alert key={idx} severity="info" sx={{ borderRadius: 2 }}>
              {rec}
            </Alert>
          ))}
        </Stack>
      </Box>
    </Paper>
  );
};

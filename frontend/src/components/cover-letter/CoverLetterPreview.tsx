'use client';

import React from 'react';
import { Box, Typography, Paper, Divider, Stack } from '@mui/material';
import { CoverLetter } from '@/features/cover-letter/types';

export interface CoverLetterPreviewProps {
  letter: Partial<CoverLetter>;
  templateName?: string;
}

export const CoverLetterPreview: React.FC<CoverLetterPreviewProps> = ({ letter, templateName = 'modern' }) => {
  const isMinimal = templateName === 'minimal';
  const isExecutive = templateName === 'executive';

  return (
    <Paper
      elevation={6}
      sx={{
        width: '100%',
        maxWidth: '800px',
        minHeight: '1000px',
        mx: 'auto',
        p: { xs: 4, md: 6 },
        background: '#ffffff',
        color: '#1e293b',
        borderRadius: 2,
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        fontFamily: isExecutive ? '"Georgia", "Times New Roman", serif' : '"Inter", sans-serif',
      }}
    >
      {/* Header Accent */}
      <Box mb={4} pb={2} borderBottom={isMinimal ? '1px solid #e2e8f0' : '3px solid #6366f1'}>
        <Typography variant="h4" fontWeight={800} color="#0f172a">
          {letter.signature || 'Alex Morgan'}
        </Typography>
        <Typography variant="subtitle1" color="#64748b" fontWeight={500}>
          {letter.jobTitle || 'Senior Software Engineer'}
        </Typography>
        <Stack direction="row" spacing={3} mt={1}>
          <Typography variant="caption" color="#475569">
            {letter.location || 'San Francisco, CA'}
          </Typography>
          <Typography variant="caption" color="#475569">
            {letter.date || 'August 8, 2026'}
          </Typography>
        </Stack>
      </Box>

      {/* Recipient Details */}
      <Box mb={4}>
        <Typography variant="subtitle2" fontWeight={700} color="#334155">
          {letter.recipientName || 'Hiring Manager'}
        </Typography>
        <Typography variant="body2" color="#64748b">
          {letter.recipientTitle || 'Head of Talent Acquisition'}
        </Typography>
        <Typography variant="body2" fontWeight={600} color="#0f172a">
          {letter.companyName || 'TechFlow Systems'}
        </Typography>
        {letter.jobReferenceNumber && (
          <Typography variant="caption" color="#94a3b8" display="block" mt={0.5}>
            Ref: {letter.jobReferenceNumber}
          </Typography>
        )}
      </Box>

      {/* Opening Greeting */}
      <Typography variant="subtitle1" fontWeight={700} mb={2} color="#0f172a">
        {letter.openingGreeting || 'Dear Hiring Team,'}
      </Typography>

      {/* Body Content */}
      <Stack spacing={2.5} mb={4} sx={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#334155' }}>
        {letter.introduction && <Typography paragraph sx={{ mb: 0 }}>{letter.introduction}</Typography>}
        {letter.body && <Typography paragraph sx={{ mb: 0 }}>{letter.body}</Typography>}
        {letter.closing && <Typography paragraph sx={{ mb: 0 }}>{letter.closing}</Typography>}
      </Stack>

      {/* Signature */}
      <Box mt={6}>
        <Typography variant="body2" color="#64748b" mb={1}>
          Sincerely,
        </Typography>
        <Typography variant="h6" fontWeight={700} color="#0f172a">
          {letter.signature || 'Alex Morgan'}
        </Typography>
      </Box>
    </Paper>
  );
};

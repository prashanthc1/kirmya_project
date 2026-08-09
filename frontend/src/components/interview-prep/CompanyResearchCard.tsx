'use client';

import React from 'react';
import { Paper, Box, Typography, Stack, Chip, Divider } from '@mui/material';
import { Business, Star, Language, Group } from '@mui/icons-material';

interface CompanyResearchCardProps {
  companyName: string;
}

export const CompanyResearchCard: React.FC<CompanyResearchCardProps> = ({ companyName }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#fff',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <Business sx={{ color: '#60A5FA' }} />
        <Typography variant="h6" fontWeight={700}>
          {companyName} Interview Insights & Culture
        </Typography>
      </Stack>

      <Stack spacing={2}>
        <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'rgba(15, 23, 42, 0.5)' }}>
          <Typography variant="caption" fontWeight={700} sx={{ color: '#60A5FA', display: 'block', mb: 0.5 }}>
            CORE VALUES & CULTURE HIGHLIGHTS
          </Typography>
          <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
            Focus on customer obsession, bias for action, architectural scaling, and data-driven decision making.
          </Typography>
        </Box>

        <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'rgba(15, 23, 42, 0.5)' }}>
          <Typography variant="caption" fontWeight={700} sx={{ color: '#A78BFA', display: 'block', mb: 0.5 }}>
            MOST FREQUENT INTERVIEW PROMPTS
          </Typography>
          <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
            • &quot;Tell me about a time you handled conflicting technical priorities under tight deadlines.&quot;
            <br />
            • &quot;How do you ensure zero-downtime microservices deployments?&quot;
          </Typography>
        </Box>

        <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'rgba(15, 23, 42, 0.5)' }}>
          <Typography variant="caption" fontWeight={700} sx={{ color: '#34D399', display: 'block', mb: 0.5 }}>
            RECOMMENDED QUESTIONS TO ASK INTERVIEWERS
          </Typography>
          <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
            1. &quot;How does the engineering team evaluate technical debt vs feature delivery speed?&quot;
            <br />
            2. &quot;What are the key technical milestones for this team over the next 2 quarters?&quot;
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

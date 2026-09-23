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
        bgcolor: "background.paper",
        backdropFilter: 'blur(12px)',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        color: "text.primary",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
        <Business sx={{ color: "primary.main" }} />
        <Typography variant="h6" fontWeight={700}>
          {companyName} Interview Insights & Culture
        </Typography>
      </Stack>

      <Stack spacing={2}>
        <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "background.paper" }}>
          <Typography variant="caption" fontWeight={700} sx={{ color: "primary.main", display: 'block', mb: 0.5 }}>
            CORE VALUES & CULTURE HIGHLIGHTS
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Focus on customer obsession, bias for action, architectural scaling, and data-driven decision making.
          </Typography>
        </Box>

        <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "background.paper" }}>
          <Typography variant="caption" fontWeight={700} sx={{ color: "primary.main", display: 'block', mb: 0.5 }}>
            MOST FREQUENT INTERVIEW PROMPTS
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            • &quot;Tell me about a time you handled conflicting technical priorities under tight deadlines.&quot;
            <br />
            • &quot;How do you ensure zero-downtime microservices deployments?&quot;
          </Typography>
        </Box>

        <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: "background.paper" }}>
          <Typography variant="caption" fontWeight={700} sx={{ color: '#34D399', display: 'block', mb: 0.5 }}>
            RECOMMENDED QUESTIONS TO ASK INTERVIEWERS
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            1. &quot;How does the engineering team evaluate technical debt vs feature delivery speed?&quot;
            <br />
            2. &quot;What are the key technical milestones for this team over the next 2 quarters?&quot;
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

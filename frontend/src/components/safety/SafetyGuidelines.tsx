'use client';

import React from 'react';
import { Box, Typography, Card, Stack, Chip, Divider, useTheme } from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';

export const SafetyGuidelines: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const rules = [
    { title: 'Job Scams & Financial Fraud', desc: 'No advance payments, wire transfers, crypto payments, or fee requests before starting employment.' },
    { title: 'Fake Recruiter Accounts & Impersonation', desc: 'Recruiters must verify organization credentials and email domains.' },
    { title: 'Harassment, Bullying & Threats', desc: 'Strict prohibition of discriminatory abuse, hate speech, threats, and non-consensual personal info sharing.' },
    { title: 'Spam, Phishing & Malicious Links', desc: 'Automated messaging, scraping, credential harvesting, and suspicious off-platform links are prohibited.' },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <GavelIcon sx={{ color: '#6366f1', fontSize: 36 }} />
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          Community &amp; Safety Guidelines
        </Typography>
      </Stack>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Configurable platform policy standards for job seekers, recruiters, companies, and professional communities.
      </Typography>

      <Stack spacing={3}>
        {rules.map((rule, idx) => (
          <Card
            key={idx}
            sx={{
              p: 3,
              borderRadius: '24px',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
              <Chip label={`Rule ${idx + 1}`} size="small" color="primary" sx={{ fontWeight: 800 }} />
              <Typography variant="h6" sx={{ fontWeight: 800 }}>{rule.title}</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">{rule.desc}</Typography>
          </Card>
        ))}
      </Stack>
    </Box>
  );
};

export default SafetyGuidelines;

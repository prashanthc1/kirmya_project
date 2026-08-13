'use client';

import React from 'react';
import { Box, Typography, Card, Grid, Button, Stack, Paper, Chip, useTheme } from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import GavelIcon from '@mui/icons-material/Gavel';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import BlockIcon from '@mui/icons-material/Block';
import LockIcon from '@mui/icons-material/Lock';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Link from 'next/link';

export const SafetyCenter: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100, mx: 'auto' }}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
        <ShieldIcon sx={{ color: '#10b981', fontSize: 42 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Kirmya Safety &amp; Trust Operations Center
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Protecting our professional community against job scams, fraud, harassment, impersonation, and phishing.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              p: 3,
              borderRadius: '24px',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <GavelIcon sx={{ color: '#6366f1' }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Community Guidelines</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Understand platform standards covering fake jobs, recruiter verification, harassment, hate speech, and spam.
              </Typography>
            </Box>
            <Link href="/safety/guidelines" style={{ textDecoration: 'none' }}>
              <Button variant="contained" color="primary" fullWidth sx={{ borderRadius: '12px', fontWeight: 800 }}>
                View Guidelines
              </Button>
            </Link>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            sx={{
              p: 3,
              borderRadius: '24px',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <ReportProblemIcon sx={{ color: '#ef4444' }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Report Abuse &amp; Fraud</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Submit confidential reports regarding suspicious recruiters, fake job postings, or abusive messages.
              </Typography>
            </Box>
            <Link href="/safety/report" style={{ textDecoration: 'none' }}>
              <Button variant="outlined" color="error" fullWidth sx={{ borderRadius: '12px', fontWeight: 800 }}>
                File a Report
              </Button>
            </Link>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            sx={{
              p: 3,
              borderRadius: '24px',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                <BlockIcon sx={{ color: '#f59e0b' }} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>Blocked Accounts</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Manage your blocked users, recruiters, and companies to restrict direct messages and interactions.
              </Typography>
            </Box>
            <Link href="/safety/blocked" style={{ textDecoration: 'none' }}>
              <Button variant="outlined" color="warning" fullWidth sx={{ borderRadius: '12px', fontWeight: 800 }}>
                Manage Blocked Accounts
              </Button>
            </Link>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SafetyCenter;

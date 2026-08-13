'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Stack,
  useTheme,
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import SmartToyIcon from '@mui/icons-material/SmartToy';

export const ModerationDashboard: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [cases, setCases] = useState([
    { id: 'CASE-10023', target: 'Job Posting #9802', category: 'Fake Job Scam', risk: 85.5, status: 'Under Review', aiRec: 'Request identity verification' },
    { id: 'CASE-10024', target: 'Recruiter Account', category: 'Phishing Link', risk: 92.0, status: 'Action Pending', aiRec: 'Apply temporary messaging restriction' },
  ]);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <ShieldIcon sx={{ color: '#10b981', fontSize: 36 }} />
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Trust &amp; Safety Moderation Center
            </Typography>
          </Stack>
          <Typography variant="subtitle1" color="text.secondary">
            Human-in-the-loop review queue, fraud risk scoring, AI recommendation summary, and enforcement controls.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '24px', bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)' }}>
            <Typography variant="caption" color="text.secondary">Reports Today</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 1 }}>42</Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '24px', bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)' }}>
            <Typography variant="caption" color="text.secondary">Open Cases</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'warning.main', mt: 1 }}>12</Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '24px', bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)' }}>
            <Typography variant="caption" color="text.secondary">Fake Job Reports</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'error.main', mt: 1 }}>8</Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 3, borderRadius: '24px', bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)' }}>
            <Typography variant="caption" color="text.secondary">Avg Review Time</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'success.main', mt: 1 }}>3.4h</Typography>
          </Card>
        </Grid>
      </Grid>

      <Card
        sx={{
          borderRadius: '24px',
          p: 3,
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>Moderation Review Queue</Typography>
        <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Case ID</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Target</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Risk Score</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>AI Recommendation</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Human Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cases.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell><Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{c.id}</Typography></TableCell>
                  <TableCell>{c.target}</TableCell>
                  <TableCell><Chip label={c.category} size="small" color="error" variant="outlined" sx={{ fontWeight: 700 }} /></TableCell>
                  <TableCell><Typography variant="body2" sx={{ fontWeight: 800, color: 'error.main' }}>{c.risk} / 100</Typography></TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <SmartToyIcon sx={{ fontSize: 18, color: '#6366f1' }} />
                      <Typography variant="caption" color="text.secondary">{c.aiRec}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell><Chip label={c.status} size="small" color="info" sx={{ fontWeight: 800 }} /></TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="contained" sx={{ borderRadius: '8px', fontWeight: 700 }}>Review Case</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default ModerationDashboard;

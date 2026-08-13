'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
  useTheme,
} from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

export const ReportHistory: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const reports = [
    { id: 'REP-8821', target: 'Recruiter Account', category: 'Fake Recruiter', status: 'Under Review', date: '2026-08-12' },
    { id: 'REP-8704', target: 'Job Posting #9021', category: 'Fake Job / Scam', status: 'Action Taken', date: '2026-08-10' },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
        <ReportProblemIcon sx={{ color: '#ef4444', fontSize: 36 }} />
        <Typography variant="h4" sx={{ fontWeight: 900 }}>
          My Submitted Reports
        </Typography>
      </Stack>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Track status updates for your reports. Reporter identities remain confidential.
      </Typography>

      <Card
        sx={{
          borderRadius: '24px',
          p: 3,
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Report Number</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Target</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Submitted Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((rep) => (
                <TableRow key={rep.id} hover>
                  <TableCell><Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{rep.id}</Typography></TableCell>
                  <TableCell>{rep.target}</TableCell>
                  <TableCell><Chip label={rep.category} size="small" variant="outlined" sx={{ fontWeight: 700 }} /></TableCell>
                  <TableCell><Chip label={rep.status} size="small" color="info" sx={{ fontWeight: 800 }} /></TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{rep.date}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default ReportHistory;

'use client';

import React, { useState } from 'react';
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
  Button,
  Stack,
  useTheme,
} from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export const ReportManagement: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [reports, setReports] = useState([
    {
      id: 'rep1',
      category: 'Job Scam',
      targetType: 'Job',
      targetTitle: 'Remote Data Entry - $5000/wk',
      reason: 'Asking candidate for $250 advance equipment fee.',
      priority: 'Critical',
      status: 'New',
      createdAt: '2026-08-12 14:00',
    },
    {
      id: 'rep2',
      category: 'Harassment',
      targetType: 'Message',
      targetTitle: 'Private Message from Recruiter',
      reason: 'Abusive language sent after job application withdrawal.',
      priority: 'High',
      status: 'Under Review',
      createdAt: '2026-08-12 10:30',
    },
  ]);

  const handleResolve = (id: string) => {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'Resolved' } : r)));
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
        Centralized Content Report Management
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Review and resolve user-submitted abuse reports across Profiles, Jobs, Companies, Recruiters, and Messages.
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
                <TableCell sx={{ fontWeight: 800 }}>Category &amp; Target</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Report Detail</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{r.category}</Typography>
                    <Typography variant="caption" color="text.secondary">{r.targetType}: {r.targetTitle}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{r.reason}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={r.priority}
                      size="small"
                      color={r.priority === 'Critical' ? 'error' : 'warning'}
                      sx={{ fontWeight: 900 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={r.status} size="small" variant="outlined" sx={{ fontWeight: 800 }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{r.createdAt}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    {r.status !== 'Resolved' && (
                      <Button
                        size="small"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleResolve(r.id)}
                        sx={{ fontWeight: 800 }}
                      >
                        Resolve
                      </Button>
                    )}
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

export default ReportManagement;

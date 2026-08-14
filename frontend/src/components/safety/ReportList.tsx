'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Stack,
  CircularProgress,
  Box,
  useTheme,
} from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import SecurityIcon from '@mui/icons-material/Security';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { safetyApi } from '../../features/trust_safety/api';
import { SafetyReport } from '../../features/trust_safety/types';

export const ReportList: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    safetyApi
      .getUserReports()
      .then((res) => {
        if (mounted) {
          setReports(res || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
      case 'action_taken':
        return 'success';
      case 'under_review':
      case 'investigating':
        return 'warning';
      case 'dismissed':
        return 'default';
      default:
        return 'info';
    }
  };

  return (
    <Card
      sx={{
        borderRadius: '24px',
        p: 3,
        bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <ReportProblemIcon color="primary" sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            My Submitted Reports
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Track status updates for reports you submitted to Trust & Safety moderation.
          </Typography>
        </Box>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : reports.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          You have not submitted any safety reports.
        </Typography>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Report ID</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Target Entity</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Privacy</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Date Submitted</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace' }}>{r.id}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{r.target_title || r.target_id}</TableCell>
                  <TableCell>
                    <Chip label={r.category.toUpperCase().replace('_', ' ')} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    {r.reporter_privacy !== false ? (
                      <Chip
                        icon={<VisibilityOffIcon />}
                        label="Anonymous"
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    ) : (
                      <Chip label="Identified" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={r.status.toUpperCase().replace('_', ' ')}
                      color={getStatusColor(r.status)}
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
                  </TableCell>
                  <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Card>
  );
};

export default ReportList;

'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Grid,
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
  LinearProgress,
} from '@mui/material';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { DataQualityCheckItem } from '@/features/privacy/types';
import { privacyApi } from '@/features/privacy/services/privacyApi';

const metricLabels: Record<DataQualityCheckItem['metricType'], string> = {
  completeness: 'Completeness',
  accuracy: 'Accuracy',
  consistency: 'Consistency',
  uniqueness: 'Uniqueness',
  validity: 'Validity & Format',
};

const statusColors: Record<DataQualityCheckItem['status'], 'success' | 'warning' | 'error'> = {
  passed: 'success',
  warning: 'warning',
  failed: 'error',
};

export const DataQualityDashboard: React.FC = () => {
  const [checks, setChecks] = useState<DataQualityCheckItem[]>([]);
  const [score, setScore] = useState({
    overallScore: 94.2,
    passedCount: 14,
    warningCount: 2,
    failedCount: 1,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [checksData, scoreData] = await Promise.all([
      privacyApi.getDataQualityChecks(),
      privacyApi.getOverallQualityScore(),
    ]);
    setChecks(checksData);
    setScore(scoreData);
    setLoading(false);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Top Metrics Banner */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              p: 3,
              borderRadius: '24px',
              backdropFilter: 'blur(12px)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Overall Data Quality Score
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 900, color: 'primary.main', mt: 0.5 }}>
                {score.overallScore}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Automated continuous validation
              </Typography>
            </Box>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <CircularProgress
                variant="determinate"
                value={score.overallScore}
                size={70}
                thickness={5}
                color={score.overallScore > 90 ? 'success' : 'warning'}
              />
              <Box
                sx={{
                  top: 0,
                  left: 0,
                  bottom: 0,
                  right: 0,
                  position: 'absolute',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <QueryStatsIcon color="action" />
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4} md={2.6}>
          <Card
            sx={{
              p: 3,
              borderRadius: '24px',
              backdropFilter: 'blur(12px)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <CheckCircleOutlineIcon color="success" />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                Passed Checks
              </Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'success.main' }}>
              {score.passedCount}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4} md={2.7}>
          <Card
            sx={{
              p: 3,
              borderRadius: '24px',
              backdropFilter: 'blur(12px)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <WarningAmberIcon color="warning" />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                Warnings
              </Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'warning.main' }}>
              {score.warningCount}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4} md={2.7}>
          <Card
            sx={{
              p: 3,
              borderRadius: '24px',
              backdropFilter: 'blur(12px)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <ErrorOutlineIcon color="error" />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                Failed Anomaly Checks
              </Typography>
            </Stack>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'error.main' }}>
              {score.failedCount}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Quality Checks Table */}
      <Card
        sx={{
          borderRadius: '24px',
          p: 3,
          backdropFilter: 'blur(12px)',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
          Data Quality Rule Verification & Anomaly Counts
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Dataset</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Validation Rule</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Metric Type</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Pass Rate (%)</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Anomalies Flagged</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Last Checked</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {checks.map((check) => (
                <TableRow key={check.id} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{check.datasetName}</TableCell>
                  <TableCell>{check.checkName}</TableCell>
                  <TableCell>
                    <Chip label={metricLabels[check.metricType]} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ minWidth: 160 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: '100%', mr: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={check.passRate}
                          color={statusColors[check.status]}
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        {check.passRate}%
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 800, color: check.anomaliesCount > 50 ? 'error.main' : 'text.primary' }}>
                    {check.anomaliesCount}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={check.status.toUpperCase()}
                      color={statusColors[check.status]}
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
                  </TableCell>
                  <TableCell>{new Date(check.checkedAt).toLocaleTimeString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default DataQualityDashboard;

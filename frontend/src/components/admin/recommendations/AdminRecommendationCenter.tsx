'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  TextField,
  Stack,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Slider,
  Switch,
  FormControlLabel,
  useTheme,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TuneIcon from '@mui/icons-material/Tune';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { recommendationApi } from '../../../features/recommendation_engine/api';

export const AdminRecommendationCenter: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [config, setConfig] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [cfg, met] = await Promise.all([
      recommendationApi.getAdminConfig(),
      recommendationApi.getAdminMetrics(),
    ]);
    setConfig(cfg);
    setMetrics(met);
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    await recommendationApi.updateAdminConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
        Kirmya Recommendation Studio &amp; Algorithm Tuning
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Configure scoring weights, candidate pool limits, diversity penalties, and monitor recommendation engagement metrics.
      </Typography>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>
          Recommendation engine configuration saved and re-indexed across candidate pipelines!
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
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
              <TuneIcon sx={{ color: '#6366f1', fontSize: 32 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Model Weights &amp; Scoring Hyperparameters
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active Algorithm: {config?.algorithmVersion || 'v1.4.0'} ({config?.modelName || 'kirmya_hybrid_v1'})
                </Typography>
              </Box>
            </Stack>

            {config && (
              <Stack spacing={3}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                    Skill Match Weight ({Math.round(config.skillMatchWeight * 100)}%)
                  </Typography>
                  <Slider
                    value={config.skillMatchWeight}
                    min={0.1}
                    max={0.6}
                    step={0.05}
                    onChange={(_, val) => setConfig({ ...config, skillMatchWeight: val as number })}
                    valueLabelDisplay="auto"
                  />
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                    Title Match Weight ({Math.round(config.titleMatchWeight * 100)}%)
                  </Typography>
                  <Slider
                    value={config.titleMatchWeight}
                    min={0.1}
                    max={0.5}
                    step={0.05}
                    onChange={(_, val) => setConfig({ ...config, titleMatchWeight: val as number })}
                    valueLabelDisplay="auto"
                  />
                </Box>

                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                    Location Compatibility Weight ({Math.round(config.locationMatchWeight * 100)}%)
                  </Typography>
                  <Slider
                    value={config.locationMatchWeight}
                    min={0.05}
                    max={0.4}
                    step={0.05}
                    onChange={(_, val) => setConfig({ ...config, locationMatchWeight: val as number })}
                    valueLabelDisplay="auto"
                  />
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Candidate Pool Limit"
                      value={config.candidatePoolLimit}
                      onChange={(e) => setConfig({ ...config, candidatePoolLimit: parseInt(e.target.value) || 100 })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Min Score Threshold"
                      value={config.minScoreThreshold}
                      onChange={(e) => setConfig({ ...config, minScoreThreshold: parseInt(e.target.value) || 40 })}
                    />
                  </Grid>
                </Grid>

                <Button
                  variant="contained"
                  onClick={handleSaveConfig}
                  sx={{
                    py: 1.2,
                    borderRadius: '12px',
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  }}
                >
                  Apply &amp; Re-Index Engine Weights
                </Button>
              </Stack>
            )}
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
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
              <AnalyticsIcon sx={{ color: '#10b981', fontSize: 32 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Daily Recommendation Engagement &amp; Conversion
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Real-time CTR, application, and latency telemetry across categories.
                </Typography>
              </Box>
            </Stack>

            <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Impressions</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Clicks</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>Applies / Saves</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>CTR</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {metrics.map((m) => (
                    <TableRow key={m.id} hover>
                      <TableCell>
                        <Chip label={m.itemType.toUpperCase()} size="small" color="primary" sx={{ fontWeight: 800 }} />
                      </TableCell>
                      <TableCell>{m.totalImpressions.toLocaleString()}</TableCell>
                      <TableCell>{m.totalClicks.toLocaleString()}</TableCell>
                      <TableCell>{(m.totalApplies + m.totalSaves).toLocaleString()}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#10b981' }}>
                          {((m.totalClicks / (m.totalImpressions || 1)) * 100).toFixed(1)}%
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminRecommendationCenter;

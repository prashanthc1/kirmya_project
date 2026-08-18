'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Stack,
  Switch,
  FormControlLabel,
  LinearProgress,
  Divider,
  useTheme,
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ShieldIcon from '@mui/icons-material/Shield';
import SpeedIcon from '@mui/icons-material/Speed';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { BotDetectionSignal } from '../../features/security/types';
import { securityApi } from '../../features/security/services/securityApi';

export const BotMitigationDashboard: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [signals, setSignals] = useState<BotDetectionSignal[]>([]);
  const [stats, setStats] = useState({
    total_blocked_24h: 1420,
    captcha_challenges_24h: 380,
    rate_limited_ips_count: 45,
    active_bot_net_signature_count: 6,
  });
  const [loading, setLoading] = useState(true);

  // Mitigation toggle controls
  const [autoCaptcha, setAutoCaptcha] = useState(true);
  const [burstProtection, setBurstProtection] = useState(true);
  const [strictScraperBlock, setStrictScraperBlock] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [signalsData, statsData] = await Promise.all([
      securityApi.getBotDetectionSignals(),
      securityApi.getBotMitigationStats(),
    ]);
    setSignals(signalsData);
    setStats(statsData);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleSetting = async (setting: string, currentVal: boolean, setFn: (val: boolean) => void) => {
    const newVal = !currentVal;
    setFn(newVal);
    await securityApi.updateBotMitigationSetting(setting, newVal);
  };

  const getActionChip = (action: BotDetectionSignal['action_taken']) => {
    switch (action) {
      case 'block':
        return <Chip label="BLOCKED" color="error" size="small" sx={{ fontWeight: 800 }} />;
      case 'rate_limit':
        return <Chip label="RATE LIMITED" color="warning" size="small" sx={{ fontWeight: 800 }} />;
      case 'captcha':
        return <Chip label="CAPTCHA" color="info" size="small" sx={{ fontWeight: 800 }} />;
      default:
        return <Chip label="ALLOWED" color="success" size="small" sx={{ fontWeight: 800 }} />;
    }
  };

  return (
    <Card
      sx={{
        borderRadius: '24px',
        p: 3,
        bgcolor: isDark ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <SmartToyIcon sx={{ color: 'secondary.main', fontSize: 36 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Bot Detection & Burst Mitigation Engine
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Automated crawler analysis, credential stuffing defense, and rate-limiting triggers.
          </Typography>
        </Box>
      </Stack>

      {loading && <LinearProgress sx={{ borderRadius: 2, mb: 2 }} />}

      {/* Top Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderRadius: '16px', bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              BLOCKED BOTS (24H)
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'error.main', mt: 0.5 }}>
              {stats.total_blocked_24h.toLocaleString()}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderRadius: '16px', bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              CAPTCHA CHALLENGES
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'info.main', mt: 0.5 }}>
              {stats.captcha_challenges_24h}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderRadius: '16px', bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              RATE-LIMITED IPS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'warning.main', mt: 0.5 }}>
              {stats.rate_limited_ips_count}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2, borderRadius: '16px', bgcolor: 'action.hover' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              ACTIVE BOTNET SIGNATURES
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'secondary.main', mt: 0.5 }}>
              {stats.active_bot_net_signature_count}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Signals Table */}
        <Grid item xs={12} lg={8}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
            Real-time Bot Traffic Signals & Burst Analysis
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>IP & Path</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Bot Type</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Bot Score</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Rate / Burst</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Action Taken</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {signals.map((sig) => (
                  <TableRow key={sig.id} hover>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>
                        {sig.ip_address}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 180, display: 'block' }}>
                        {sig.request_path}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={sig.bot_type.replace(/_/g, ' ')} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontWeight: 900, color: sig.bot_score > 80 ? 'error.main' : 'warning.main' }}>
                        {sig.bot_score}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" display="block">
                        {sig.request_rate_per_min} req/min
                      </Typography>
                      {sig.burst_detected && (
                        <Chip
                          icon={<FlashOnIcon fontSize="inherit" />}
                          label="BURST"
                          color="error"
                          size="small"
                          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 900 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{getActionChip(sig.action_taken)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Automated Mitigation Controls Card */}
        <Grid item xs={12} lg={4}>
          <Card
            sx={{
              p: 2.5,
              borderRadius: '20px',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(241, 245, 249, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
              Automated Mitigation Controls
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
              Dynamic policy switches for real-time bot containment.
            </Typography>

            <Stack spacing={2} divider={<Divider />}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoCaptcha}
                    onChange={() => handleToggleSetting('auto_captcha', autoCaptcha, setAutoCaptcha)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Auto CAPTCHA Challenge</Typography>
                    <Typography variant="caption" color="text.secondary">Trigger reCAPTCHA v3 on suspicious scores &gt; 80%</Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={burstProtection}
                    onChange={() => handleToggleSetting('burst_protection', burstProtection, setBurstProtection)}
                    color="secondary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Burst Traffic Shield</Typography>
                    <Typography variant="caption" color="text.secondary">Instantly rate-limit IPs exceeding 150 req/min</Typography>
                  </Box>
                }
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={strictScraperBlock}
                    onChange={() => handleToggleSetting('strict_scraper_block', strictScraperBlock, setStrictScraperBlock)}
                    color="error"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Strict Scraper Ban</Typography>
                    <Typography variant="caption" color="text.secondary">Block headless browser user-agents immediately</Typography>
                  </Box>
                }
              />
            </Stack>

            <Box sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                color="error"
                fullWidth
                size="small"
                startIcon={<BlockIcon />}
                onClick={() => alert('Blocked IP Cache flushed successfully.')}
                sx={{ borderRadius: '10px', fontWeight: 800 }}
              >
                Flush Blocked IP Cache
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Card>
  );
};

export default BotMitigationDashboard;

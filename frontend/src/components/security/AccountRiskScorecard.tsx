'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Button,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
} from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RefreshIcon from '@mui/icons-material/Refresh';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { AccountRiskScore } from '../../features/security/types';
import { securityApi } from '../../features/security/services/securityApi';

export const AccountRiskScorecard: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [scores, setScores] = useState<AccountRiskScore[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [currentScore, setCurrentScore] = useState<AccountRiskScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [reassessing, setReassessing] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await securityApi.getAccountRiskScores();
      setScores(data);
      if (data.length > 0) {
        setSelectedUserId(data[0].user_id);
        setCurrentScore(data[0]);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    const target = scores.find((s) => s.user_id === userId) || null;
    setCurrentScore(target);
  };

  const handleReassess = async () => {
    if (!selectedUserId) return;
    setReassessing(true);
    const updated = await securityApi.reassessAccountRisk(selectedUserId);
    setScores((prev) => prev.map((s) => (s.user_id === updated.user_id ? updated : s)));
    setCurrentScore(updated);
    setReassessing(false);
  };

  const getRiskColor = (level?: AccountRiskScore['risk_level']) => {
    switch (level) {
      case 'critical':
        return 'error.main';
      case 'high':
        return 'error.light';
      case 'medium':
        return 'warning.main';
      default:
        return 'success.main';
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
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <SpeedIcon sx={{ color: 'warning.main', fontSize: 32 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Account Risk Scorecard & Factor Analysis
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Individual candidate and employer risk rating evaluation (0 - 100).
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel>Select Account</InputLabel>
            <Select
              label="Select Account"
              value={selectedUserId}
              onChange={(e) => handleSelectUser(e.target.value)}
            >
              {scores.map((s) => (
                <MenuItem key={s.user_id} value={s.user_id}>
                  {s.user_email} ({s.risk_score} Score)
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={handleReassess}
            disabled={reassessing || !selectedUserId}
            sx={{ borderRadius: '10px', fontWeight: 800 }}
          >
            {reassessing ? 'Assessing...' : 'Reassess'}
          </Button>
        </Stack>
      </Stack>

      {loading && <LinearProgress sx={{ borderRadius: 2, mb: 2 }} />}

      {currentScore && (
        <Grid container spacing={3}>
          {/* Main Risk Gauge Card */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                p: 3,
                borderRadius: '20px',
                textAlign: 'center',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(241, 245, 249, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                OVERALL ACCOUNT RISK SCORE
              </Typography>
              <Typography
                variant="h2"
                sx={{ fontWeight: 900, mt: 1, mb: 0.5, color: getRiskColor(currentScore.risk_level) }}
              >
                {currentScore.risk_score}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                OUT OF 100
              </Typography>

              <Chip
                label={`RISK LEVEL: ${currentScore.risk_level.toUpperCase()}`}
                sx={{
                  mt: 2,
                  fontWeight: 900,
                  bgcolor: getRiskColor(currentScore.risk_level),
                  color: '#fff',
                }}
              />

              <Box sx={{ mt: 3, textAlign: 'left' }}>
                <Stack spacing={2}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <SmartToyIcon fontSize="inherit" /> Bot Confidence
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 800 }}>{currentScore.bot_confidence}%</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={currentScore.bot_confidence}
                      color={currentScore.bot_confidence > 70 ? 'error' : currentScore.bot_confidence > 40 ? 'warning' : 'success'}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <GavelIcon fontSize="inherit" /> Fraud Probability
                      </Typography>
                      <Typography variant="caption" sx={{ fontWeight: 800 }}>{currentScore.fraud_probability}%</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={currentScore.fraud_probability}
                      color={currentScore.fraud_probability > 70 ? 'error' : currentScore.fraud_probability > 40 ? 'warning' : 'success'}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                </Stack>
              </Box>
            </Card>
          </Grid>

          {/* Risk Factors Breakdown */}
          <Grid item xs={12} md={8}>
            <Card
              sx={{
                p: 3,
                borderRadius: '20px',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.6)' : 'rgba(241, 245, 249, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                height: '100%',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                Identified Risk Factors ({currentScore.risk_factors.length})
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Signal vectors contributing to account risk profile for <strong>{currentScore.user_email}</strong>.
              </Typography>

              <Divider sx={{ mb: 2 }} />

              {currentScore.risk_factors.length === 0 ? (
                <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
                  <CheckCircleOutlineIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>Clean Risk Profile</Typography>
                  <Typography variant="caption" color="text.secondary">No anomalous security flags or threat signals detected.</Typography>
                </Stack>
              ) : (
                <List disablePadding>
                  {currentScore.risk_factors.map((rf, idx) => (
                    <ListItem
                      key={idx}
                      sx={{
                        bgcolor: 'action.hover',
                        borderRadius: '12px',
                        mb: 1.5,
                        p: 1.5,
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <WarningAmberIcon color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                              {rf.factor}
                            </Typography>
                            <Chip
                              label={`+${rf.score_impact} Risk`}
                              color="error"
                              size="small"
                              sx={{ fontWeight: 900, height: 20, fontSize: '0.7rem' }}
                            />
                          </Stack>
                        }
                        secondary={
                          <React.Fragment>
                            <Typography variant="caption" color="text.secondary" display="block">
                              {rf.description}
                            </Typography>
                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                              Detected: {new Date(rf.detected_at).toLocaleString()}
                            </Typography>
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Card>
          </Grid>
        </Grid>
      )}
    </Card>
  );
};

export default AccountRiskScorecard;

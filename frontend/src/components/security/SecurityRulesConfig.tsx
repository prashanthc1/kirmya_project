'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Chip,
  IconButton,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  LinearProgress,
  useTheme,
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import EditIcon from '@mui/icons-material/Edit';
import SecurityIcon from '@mui/icons-material/Security';
import ShieldMoonIcon from '@mui/icons-material/ShieldMoon';

import { SecurityRule } from '../../features/security/types';
import { securityApi } from '../../features/security/services/securityApi';

export const SecurityRulesConfig: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [rules, setRules] = useState<SecurityRule[]>([]);
  const [loading, setLoading] = useState(true);

  // Category filter
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SecurityRule | null>(null);
  const [threshold, setThreshold] = useState<number>(5);
  const [timeWindowSeconds, setTimeWindowSeconds] = useState<number>(60);
  const [action, setAction] = useState<SecurityRule['action']>('block');
  const [severity, setSeverity] = useState<SecurityRule['severity']>('high');

  const fetchRules = async () => {
    setLoading(true);
    const data = await securityApi.getSecurityRules();
    setRules(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggleRule = async (ruleId: string, currentEnabled: boolean) => {
    const updated = await securityApi.toggleSecurityRule(ruleId, !currentEnabled);
    setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleOpenEdit = (rule: SecurityRule) => {
    setEditingRule(rule);
    setThreshold(rule.threshold);
    setTimeWindowSeconds(rule.time_window_seconds);
    setAction(rule.action);
    setSeverity(rule.severity);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRule) return;
    const updated = await securityApi.updateSecurityRule(editingRule.id, {
      threshold,
      time_window_seconds: timeWindowSeconds,
      action,
      severity,
    });
    setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setEditModalOpen(false);
  };

  const getActionChip = (act: SecurityRule['action']) => {
    switch (act) {
      case 'block':
        return <Chip label="BLOCK" color="error" size="small" sx={{ fontWeight: 800 }} />;
      case 'lock_account':
        return <Chip label="LOCK ACCOUNT" color="error" variant="outlined" size="small" sx={{ fontWeight: 800 }} />;
      case 'challenge':
        return <Chip label="CAPTCHA CHALLENGE" color="warning" size="small" sx={{ fontWeight: 800 }} />;
      case 'flag':
        return <Chip label="FLAG FOR REVIEW" color="info" size="small" sx={{ fontWeight: 800 }} />;
      default:
        return <Chip label="LOG ONLY" color="default" size="small" sx={{ fontWeight: 800 }} />;
    }
  };

  const filteredRules = rules.filter((rule) => {
    if (categoryFilter !== 'all' && rule.category !== categoryFilter) return false;
    return true;
  });

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
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TuneIcon sx={{ color: 'primary.main', fontSize: 32 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Security Rules & Safeguard Controllers
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Configure detection thresholds, mitigation triggers, and rule enforcement states.
            </Typography>
          </Box>
        </Stack>

        <FormControl size="small" sx={{ width: 180 }}>
          <InputLabel>Category</InputLabel>
          <Select label="Category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <MenuItem value="all">All Categories</MenuItem>
            <MenuItem value="auth">Authentication</MenuItem>
            <MenuItem value="bot">Bot Protection</MenuItem>
            <MenuItem value="rate_limit">Rate Limiting</MenuItem>
            <MenuItem value="fraud">Fraud Prevention</MenuItem>
            <MenuItem value="abuse">Abuse Protection</MenuItem>
            <MenuItem value="session">Session Security</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {loading && <LinearProgress sx={{ borderRadius: 2, mb: 2 }} />}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Enforced</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Rule Name & Description</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Threshold</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Window</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Action</TableCell>
              <TableCell sx={{ fontWeight: 800 }} align="right">Edit</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No rules found for the selected category.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredRules.map((rule) => (
                <TableRow key={rule.id} hover sx={{ opacity: rule.enabled ? 1 : 0.65 }}>
                  <TableCell>
                    <Switch
                      checked={rule.enabled}
                      onChange={() => handleToggleRule(rule.id, rule.enabled)}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 320 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                      {rule.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {rule.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={rule.category.toUpperCase()} size="small" variant="outlined" sx={{ fontWeight: 800 }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      {rule.threshold} reqs
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {rule.time_window_seconds > 0 ? `${rule.time_window_seconds}s` : 'Immediate'}
                    </Typography>
                  </TableCell>
                  <TableCell>{getActionChip(rule.action)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Configure Rule Thresholds">
                      <IconButton size="small" onClick={() => handleOpenEdit(rule)} color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Threshold Editing Modal */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Configure Security Rule: {editingRule?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Adjust detection trigger limit, rolling time window, and enforcement action.
          </Typography>
          <Stack spacing={2.5}>
            <TextField
              label="Threshold Limit (Requests / Events)"
              type="number"
              fullWidth
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
            />
            <TextField
              label="Rolling Time Window (Seconds)"
              type="number"
              fullWidth
              value={timeWindowSeconds}
              onChange={(e) => setTimeWindowSeconds(Number(e.target.value))}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Enforcement Action</InputLabel>
              <Select label="Enforcement Action" value={action} onChange={(e) => setAction(e.target.value as SecurityRule['action'])}>
                <MenuItem value="log">Log Only</MenuItem>
                <MenuItem value="flag">Flag for Review</MenuItem>
                <MenuItem value="challenge">CAPTCHA Challenge</MenuItem>
                <MenuItem value="block">Block IP / Connection</MenuItem>
                <MenuItem value="lock_account">Lock Account</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Rule Severity</InputLabel>
              <Select label="Rule Severity" value={severity} onChange={(e) => setSeverity(e.target.value as SecurityRule['severity'])}>
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit} sx={{ borderRadius: '8px', fontWeight: 800 }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default SecurityRulesConfig;

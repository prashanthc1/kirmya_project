'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import GavelIcon from '@mui/icons-material/Gavel';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { trustApi } from '../../features/trust_safety/api';
import {
  FraudLog,
  Report,
  VerificationBadge,
} from '../../features/trust_safety/types';

export default function TrustSafetyPage() {
  const [tabValue, setTabValue] = useState<number>(0);
  const [reports, setReports] = useState<Report[]>([]);
  const [fraudLogs, setFraudLogs] = useState<FraudLog[]>([]);
  const [badges, setBadges] = useState<VerificationBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Moderation Action Modal
  const [openActionModal, setOpenActionModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionType, setActionType] = useState<'warn' | 'block' | 'suspend' | 'remove'>('remove');
  const [actionNotes, setActionNotes] = useState('Removed listing due to upfront fee request violation.');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rRes, fRes, bRes] = await Promise.all([
        trustApi.getReports('ALL'),
        trustApi.getFraudLogs(),
        trustApi.getBadges(),
      ]);
      setReports(rRes.data || []);
      setFraudLogs(fRes.data || []);
      setBadges(bRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAction = (rep: Report) => {
    setSelectedReport(rep);
    setOpenActionModal(true);
  };

  const handleExecuteAction = async () => {
    if (!selectedReport) return;
    try {
      await trustApi.executeModerationAction(selectedReport.id, {
        action: actionType,
        notes: actionNotes,
      });
      setOpenActionModal(false);
      setSuccessMsg(`Moderation action "${actionType.toUpperCase()}" executed for report #${selectedReport.id.slice(0, 8)}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100vh', color: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: '#f43f5e', p: 1.5, borderRadius: 2, color: '#fff', display: 'flex' }}>
              <SecurityIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(90deg, #f43f5e 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Kirmya Trust & Safety Moderation Studio
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Privacy-first professional environment with automated fake job detection & verification badges
              </Typography>
            </Box>
          </Box>

          <Chip icon={<VerifiedUserIcon />} label="TRUST SYSTEM ACTIVE" color="success" sx={{ fontWeight: 'bold' }} />
        </Box>

        {successMsg && (
          <Alert severity="success" onClose={() => setSuccessMsg(null)} sx={{ mb: 3, bgcolor: '#064e3b', color: '#6ee7b7' }}>
            {successMsg}
          </Alert>
        )}

        {/* Navigation Tabs */}
        <Paper sx={{ mb: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
          <Tabs
            value={tabValue}
            onChange={(_, val) => setTabValue(val)}
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              '& .MuiTabs-indicator': { bgcolor: '#f43f5e' },
              '& .MuiTab-root': { color: '#94a3b8', fontWeight: 'bold', textTransform: 'none' },
              '& .Mui-selected': { color: '#f43f5e' },
            }}
          >
            <Tab icon={<ReportProblemIcon fontSize="small" />} iconPosition="start" label="Incident Reports Queue" />
            <Tab icon={<SecurityIcon fontSize="small" />} iconPosition="start" label="Automated Fake Job & Spam Detection" />
            <Tab icon={<VerifiedUserIcon fontSize="small" />} iconPosition="start" label="Verification Badges Hub" />
          </Tabs>
        </Paper>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#f43f5e' } }} />}

        {/* Tab 0: Incident Reports Queue */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {reports.map((rep) => (
              <Grid item xs={12} md={6} key={rep.id}>
                <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Chip label={rep.category.toUpperCase()} color="error" size="small" sx={{ fontWeight: 'bold' }} />
                      <Chip label={rep.status.toUpperCase()} size="small" sx={{ bgcolor: '#334155', color: '#fff' }} />
                    </Box>

                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 1 }}>
                      {rep.target_name}
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2.5, lineHeight: 1.6 }}>
                      Reason: {rep.reason}
                    </Typography>

                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<GavelIcon />}
                      onClick={() => handleOpenAction(rep)}
                      sx={{ bgcolor: '#f43f5e', color: '#fff', fontWeight: 'bold' }}
                    >
                      Enforce Moderation Action
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Tab 1: Automated Fake Job & Spam Detection */}
        {tabValue === 1 && (
          <Grid container spacing={3}>
            {fraudLogs.map((log) => (
              <Grid item xs={12} key={log.id}>
                <Card sx={{ bgcolor: '#1e293b', border: '1px solid #f43f5e', borderRadius: 2.5 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc' }}>
                        {log.entity_title}
                      </Typography>
                      <Chip label={`${log.fraud_score}% FRAUD RISK`} color="error" sx={{ fontWeight: 'bold', fontSize: 14 }} />
                    </Box>

                    <Box sx={{ bgcolor: '#0f172a', p: 2, borderRadius: 2, mb: 2, border: '1px solid #334155' }}>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#f43f5e', mb: 1 }}>
                        Detection Triggers Signal Analysis:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {log.triggers.map((trig: string, idx: number) => (
                          <Chip key={idx} label={trig} size="small" sx={{ bgcolor: '#881337', color: '#fecdd3', fontWeight: 'bold' }} />
                        ))}
                      </Box>
                    </Box>

                    <Typography variant="body2" sx={{ color: '#10b981', fontWeight: 'bold' }}>
                      Automated System Action: {log.action_taken}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Tab 2: Verification Badges */}
        {tabValue === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: '#1e293b', border: '1px solid #10b981', borderRadius: 2.5 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <CheckCircleIcon sx={{ color: '#10b981', fontSize: 32 }} />
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc' }}>
                      Verified Candidate Badges
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Chip icon={<VerifiedUserIcon />} label="✓ Identity Verified (Government ID)" color="success" sx={{ fontWeight: 'bold', justifyContent: 'flex-start' }} />
                    <Chip icon={<VerifiedUserIcon />} label="✓ Employment Verified (Stripe Global)" color="success" sx={{ fontWeight: 'bold', justifyContent: 'flex-start' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Moderation Action Modal */}
        <Dialog open={openActionModal} onClose={() => setOpenActionModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1e293b', color: '#fff', border: '1px solid #334155' } }}>
          <DialogTitle sx={{ fontWeight: 'bold', color: '#f43f5e' }}>
            Execute Moderation Enforcement Action
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: '#94a3b8' }}>Enforcement Action</InputLabel>
                <Select
                  value={actionType}
                  label="Enforcement Action"
                  onChange={(e) => setActionType(e.target.value as any)}
                  sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
                >
                  <MenuItem value="warn">Issue Official Warning</MenuItem>
                  <MenuItem value="remove">Remove Listing / Post</MenuItem>
                  <MenuItem value="block">Block User Account</MenuItem>
                  <MenuItem value="suspend">Suspend Organization Account</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Audit Trail Notes & Enforcement Rationale"
                multiline
                rows={3}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                fullWidth
                InputLabelProps={{ sx: { color: '#94a3b8' } }}
                InputProps={{ sx: { color: '#fff' } }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenActionModal(false)} sx={{ color: '#94a3b8' }}>Cancel</Button>
            <Button onClick={handleExecuteAction} variant="contained" sx={{ bgcolor: '#f43f5e', color: '#fff', fontWeight: 'bold' }}>
              Confirm & Execute Action
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

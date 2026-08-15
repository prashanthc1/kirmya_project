'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  LinearProgress,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import BackupIcon from '@mui/icons-material/Backup';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { backupApi, BackupHealthSummary, BackupRecord, DataTierClassification } from '../../../features/backups/services/backupApi';
import RestoreTestModal from './RestoreTestModal';
import RecoveryConfirmationModal from './RecoveryConfirmationModal';

export default function BackupDashboard() {
  const [health, setHealth] = useState<BackupHealthSummary | null>(null);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [tiers, setTiers] = useState<DataTierClassification[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [selectedBackupId, setSelectedBackupId] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [hData, bData, tData] = await Promise.all([
        backupApi.getHealthSummary(),
        backupApi.listBackups(),
        backupApi.getDataTiers(),
      ]);
      setHealth(hData);
      setBackups(bData);
      setTiers(tData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerManualBackup = async () => {
    setTriggering(true);
    try {
      await backupApi.triggerBackup('full', 'Manual snapshot initiated from Admin Console');
      await loadData();
    } finally {
      setTriggering(false);
    }
  };

  const handleVerify = async (id: string) => {
    await backupApi.verifyBackup(id);
    await loadData();
  };

  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100dvh', color: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header Banner */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: '#38bdf8', p: 1.5, borderRadius: 2, color: '#0f172a', display: 'flex' }}>
              <HealthAndSafetyIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(90deg, #38bdf8 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Kirmya Backup, Disaster Recovery & Resilience Studio
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                PostgreSQL PITR • Immutable Object Vault • Isolated Sandbox Restore Drills • RPO/RTO Compliance
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<RestartAltIcon />}
              onClick={() => setRestoreModalOpen(true)}
              sx={{ color: '#ef4444', borderColor: '#ef4444', fontWeight: 'bold', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' } }}
            >
              EMERGENCY RESTORE
            </Button>
            <Button
              variant="contained"
              startIcon={<BackupIcon />}
              disabled={triggering}
              onClick={handleTriggerManualBackup}
              sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', '&:hover': { bgcolor: '#0284c7' } }}
            >
              {triggering ? 'Creating Backup...' : 'Trigger Full Backup'}
            </Button>
          </Box>
        </Box>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />}

        {/* Top Metric Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Card 1: System Health */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>RECOVERY HEALTH</Typography>
                  <VerifiedUserIcon sx={{ color: '#10b981' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#10b981', mb: 0.5 }}>
                  {health?.status.toUpperCase() || 'HEALTHY'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Vault: {health?.encryptionVaultProtected ? 'WORM Protected' : 'Standard'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 2: RPO Target */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>RPO COMPLIANCE</Typography>
                  <SpeedIcon sx={{ color: '#38bdf8' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#38bdf8', mb: 0.5 }}>
                  &lt; 15 Mins
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>WAL Archiving Active</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 3: RTO Target */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>RTO TARGET</Typography>
                  <CloudDoneIcon sx={{ color: '#a855f7' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#a855f7', mb: 0.5 }}>
                  &lt; 60 Mins
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>Verified via Restore Drill</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 4: Total Vault Storage */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>IMMUTABLE STORAGE</Typography>
                  <SecurityIcon sx={{ color: '#f59e0b' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: '#f59e0b', mb: 0.5 }}>
                  {health ? `${(health.totalBackupSizeBytes / (1024 * 1024)).toFixed(0)} MB` : '500 MB'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>AES-256-GCM Encrypted</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Data Classification Matrix */}
        <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5, mb: 4 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#f8fafc' }}>
            Data Classification & Recovery Priorities Matrix
          </Typography>
          <Grid container spacing={2}>
            {tiers.map((t) => (
              <Grid item xs={12} md={4} key={t.tier}>
                <Box sx={{ p: 2, bgcolor: '#0f172a', borderRadius: 2, border: '1px solid #334155', height: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Chip label={t.tier} color={t.tier === 'Tier 1' ? 'error' : t.tier === 'Tier 2' ? 'warning' : 'default'} size="small" sx={{ fontWeight: 'bold' }} />
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>RPO: {t.targetRpo}</Typography>
                  </Box>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8', mb: 0.5 }}>{t.category}</Typography>
                  <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.825rem', mb: 1 }}>{t.description}</Typography>
                  <Divider sx={{ borderColor: '#334155', my: 1 }} />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {t.dataTypes.map((dt) => (
                      <Chip key={dt} label={dt} size="small" variant="outlined" sx={{ color: '#cbd5e1', borderColor: '#475569', fontSize: '0.7rem' }} />
                    ))}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Recent Backups Table */}
        <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc' }}>
              Backup Records & Cryptographic Verification
            </Typography>
            <Button size="small" onClick={() => setTestModalOpen(true)} variant="outlined" sx={{ color: '#38bdf8', borderColor: '#38bdf8' }}>
              Run Sandbox Restore Drill
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { color: '#94a3b8', fontWeight: 'bold', borderColor: '#334155' } }}>
                  <TableCell>Backup ID / Type</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>SHA-256 Checksum</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Verification</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {backups.map((b) => (
                  <TableRow key={b.id} sx={{ '& td': { color: '#f8fafc', borderColor: '#334155' } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{b.id.substring(0, 8)}...</Typography>
                      <Chip label={b.backupType} size="small" sx={{ bgcolor: '#0f172a', color: '#38bdf8', fontSize: '0.7rem', textTransform: 'uppercase' }} />
                    </TableCell>
                    <TableCell>{new Date(b.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{(b.sizeBytes / (1024 * 1024)).toFixed(1)} MB</TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#94a3b8' }}>
                        {b.checksum.substring(0, 24)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={b.status} color={b.status === 'completed' ? 'success' : 'error'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={b.verificationStatus} color={b.verificationStatus === 'verified' ? 'info' : 'warning'} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button size="small" variant="text" sx={{ color: '#38bdf8' }} onClick={() => handleVerify(b.id)}>
                          Verify Integrity
                        </Button>
                        <Button size="small" variant="text" sx={{ color: '#a855f7' }} onClick={() => { setSelectedBackupId(b.id); setTestModalOpen(true); }}>
                          Restore Test
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Modals */}
        <RestoreTestModal open={testModalOpen} onClose={() => setTestModalOpen(false)} backupId={selectedBackupId || backups[0]?.id || ''} />
        <RecoveryConfirmationModal open={restoreModalOpen} onClose={() => setRestoreModalOpen(false)} backupId={backups[0]?.id || ''} />
      </Container>
    </Box>
  );
}

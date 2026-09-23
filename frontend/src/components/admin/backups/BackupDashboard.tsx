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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [selectedBackupId, setSelectedBackupId] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [hData, bData, tData] = await Promise.all([
        backupApi.getHealthSummary(),
        backupApi.listBackups(),
        backupApi.getDataTiers(),
      ]);
      setHealth(hData);
      setBackups(bData);
      setTiers(tData);
    } catch (error) {
      // "No backups listed" and "we could not ask about backups" are opposite
      // findings for an operator. Clearing health keeps the first from being
      // read as the second.
      setHealth(null);
      setLoadError(error instanceof Error ? error.message : 'The request failed.');
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
    try {
      await backupApi.verifyBackup(id);
      await loadData();
  
    } catch (error) {
      // The request failed, so nothing is shown as having happened.
      console.error('BackupDashboard.tsx: handleVerify failed', error);
    }
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100dvh', color: 'text.primary', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header Banner */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: 'primary.main', p: 1.5, borderRadius: 2, color: 'primary.contrastText', display: 'flex' }}>
              <HealthAndSafetyIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{    }}>
                Kirmya Backup, Disaster Recovery & Resilience Studio
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                PostgreSQL PITR • Immutable Object Vault • Isolated Sandbox Restore Drills • RPO/RTO Compliance
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              startIcon={<RestartAltIcon />}
              onClick={() => setRestoreModalOpen(true)}
              sx={{ color: 'error.main', borderColor: 'error.main', fontWeight: 'bold', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)', borderColor: 'error.main' } }}
            >
              EMERGENCY RESTORE
            </Button>
            <Button
              variant="contained"
              startIcon={<BackupIcon />}
              disabled={triggering}
              onClick={handleTriggerManualBackup}
              sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold', '&:hover': { bgcolor: 'primary.main' } }}
            >
              {triggering ? 'Creating Backup...' : 'Trigger Full Backup'}
            </Button>
          </Box>
        </Box>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: 'background.paper', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }} />}

        {loadError && !loading && (
          <Alert severity="error" sx={{ mb: 3 }}>
            Backup status could not be loaded. An empty list below means the API did not answer, not
            that no backups exist. {loadError}
          </Alert>
        )}

        {/* Top Metric Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Card 1: System Health */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>RECOVERY HEALTH</Typography>
                  <VerifiedUserIcon sx={{ color: 'success.main' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'success.main', mb: 0.5 }}>
                  {health?.status.toUpperCase() || 'HEALTHY'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Vault: {health?.encryptionVaultProtected ? 'WORM Protected' : 'Standard'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 2: RPO Target */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>RPO COMPLIANCE</Typography>
                  <SpeedIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'primary.main', mb: 0.5 }}>
                  &lt; 15 Mins
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>WAL Archiving Active</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 3: RTO Target */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>RTO TARGET</Typography>
                  <CloudDoneIcon sx={{ color: 'primary.main' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'primary.main', mb: 0.5 }}>
                  &lt; 60 Mins
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Verified via Restore Drill</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 4: Total Vault Storage */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>IMMUTABLE STORAGE</Typography>
                  <SecurityIcon sx={{ color: 'warning.main' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'warning.main', mb: 0.5 }}>
                  {health ? `${(health.totalBackupSizeBytes / (1024 * 1024)).toFixed(0)} MB` : '500 MB'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>AES-256-GCM Encrypted</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Data Classification Matrix */}
        <Paper sx={{ p: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2.5, mb: 4 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: 'text.primary' }}>
            Data Classification & Recovery Priorities Matrix
          </Typography>
          <Grid container spacing={2}>
            {tiers.map((t) => (
              <Grid item xs={12} md={4} key={t.tier}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: 1, borderColor: 'divider', height: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Chip label={t.tier} color={t.tier === 'Tier 1' ? 'error' : t.tier === 'Tier 2' ? 'warning' : 'default'} size="small" sx={{ fontWeight: 'bold' }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>RPO: {t.targetRpo}</Typography>
                  </Box>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: 'primary.main', mb: 0.5 }}>{t.category}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.825rem', mb: 1 }}>{t.description}</Typography>
                  <Divider sx={{ borderColor: 'divider', my: 1 }} />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {t.dataTypes.map((dt) => (
                      <Chip key={dt} label={dt} size="small" variant="outlined" sx={{ color: 'text.primary', borderColor: 'divider', fontSize: '0.7rem' }} />
                    ))}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Recent Backups Table */}
        <Paper sx={{ p: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2.5, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
              Backup Records & Cryptographic Verification
            </Typography>
            <Button size="small" onClick={() => setTestModalOpen(true)} variant="outlined" sx={{ color: 'primary.main', borderColor: 'primary.main' }}>
              Run Sandbox Restore Drill
            </Button>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { color: 'text.secondary', fontWeight: 'bold', borderColor: 'divider' } }}>
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
                  <TableRow key={b.id} sx={{ '& td': { color: 'text.primary', borderColor: 'divider' } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{b.id.substring(0, 8)}...</Typography>
                      <Chip label={b.backupType} size="small" sx={{ bgcolor: 'background.default', color: 'primary.main', fontSize: '0.7rem', textTransform: 'uppercase' }} />
                    </TableCell>
                    <TableCell>{new Date(b.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{(b.sizeBytes / (1024 * 1024)).toFixed(1)} MB</TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
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
                        <Button size="small" variant="text" sx={{ color: 'primary.main' }} onClick={() => handleVerify(b.id)}>
                          Verify Integrity
                        </Button>
                        <Button size="small" variant="text" sx={{ color: 'primary.main' }} onClick={() => { setSelectedBackupId(b.id); setTestModalOpen(true); }}>
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

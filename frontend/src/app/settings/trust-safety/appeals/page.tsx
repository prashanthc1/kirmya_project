'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Stack,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import LockIcon from '@mui/icons-material/Lock';
import SendIcon from '@mui/icons-material/Send';
import { trustSafetyApi } from '@/features/trust_safety/services/trustSafetyApi';
import { SafetyAppeal, UserRestriction } from '@/features/trust_safety/types';

export default function UserSettingsAppealsPage() {
  const [appeals, setAppeals] = useState<SafetyAppeal[]>([]);
  const [restrictions, setRestrictions] = useState<UserRestriction[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [appealModalOpen, setAppealModalOpen] = useState<UserRestriction | null>(null);
  const [appealReason, setAppealReason] = useState('False Positive Flag');
  const [appealExplanation, setAppealExplanation] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [appData, rstData] = await Promise.all([
        trustSafetyApi.getUserAppeals(),
        trustSafetyApi.getUserRestrictions(),
      ]);
      setAppeals(appData || []);
      setRestrictions(rstData || []);
    } catch {
      // Fallback in API
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAppealSubmit = async () => {
    if (!appealModalOpen) return;
    await trustSafetyApi.submitAppeal({
      decision_id: appealModalOpen.id,
      reason: appealReason,
      explanation: appealExplanation,
    });
    setStatusMsg('Appeal submitted successfully. Reviewer assigned.');
    setAppealModalOpen(null);
    setAppealExplanation('');
    loadData();
  };

  const getStatusChip = (status: SafetyAppeal['status']) => {
    switch (status) {
      case 'approved':
        return <Chip icon={<CheckCircleIcon />} label="Approved" color="success" size="small" sx={{ fontWeight: 800 }} />;
      case 'rejected':
        return <Chip icon={<CancelIcon />} label="Rejected" color="error" size="small" sx={{ fontWeight: 800 }} />;
      case 'under_review':
        return <Chip icon={<HourglassEmptyIcon />} label="Under Review" color="warning" size="small" sx={{ fontWeight: 800 }} />;
      case 'submitted':
      default:
        return <Chip label="Submitted" color="info" size="small" sx={{ fontWeight: 800 }} />;
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100, mx: 'auto' }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AssignmentTurnedInIcon color="primary" fontSize="large" /> User Decision Appeals Manager
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track active account restrictions and monitor the real-time status of your submitted enforcement decision appeals.
        </Typography>
      </Box>

      {statusMsg && (
        <Alert severity="success" onClose={() => setStatusMsg(null)} sx={{ mb: 3, borderRadius: '14px' }}>
          {statusMsg}
        </Alert>
      )}

      {/* Active Restrictions Section */}
      <Card sx={{ borderRadius: '24px', p: 3, mb: 4, background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(16px)' }}>
        <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
          Active Account Enforcement Status
        </Typography>

        {loading ? (
          <CircularProgress size={28} />
        ) : restrictions.length === 0 ? (
          <Alert severity="success" icon={<CheckCircleIcon />} sx={{ borderRadius: '14px' }}>
            No active restrictions on your account.
          </Alert>
        ) : (
          <Stack spacing={2}>
            {restrictions.map((rst) => (
              <Paper key={rst.id} elevation={0} sx={{ p: 2.5, borderRadius: '16px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Chip label={rst.status.toUpperCase()} color="error" size="small" sx={{ fontWeight: 900 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'error.main' }}>
                        {rst.restriction_type}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Reason: {rst.reason}
                    </Typography>
                  </Box>
                  <Button variant="contained" onClick={() => setAppealModalOpen(rst)} sx={{ borderRadius: '12px', fontWeight: 900 }}>
                    File Decision Appeal
                  </Button>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Card>

      {/* Submitted Appeals Table */}
      <Card sx={{ borderRadius: '24px', p: 3, background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(16px)' }}>
        <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
          My Submitted Decision Appeals
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900 }}>Appeal ID / Decision Ref</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Dispute Reason</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Explanation</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Submitted Date</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appeals.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, fontFamily: 'monospace' }}>
                        {app.id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ref: {app.decision_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {app.reason}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{app.explanation}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(app.submitted_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>{getStatusChip(app.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Appeal Submission Modal */}
      <Dialog
        open={Boolean(appealModalOpen)}
        onClose={() => setAppealModalOpen(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ style: { borderRadius: 24, backdropFilter: 'blur(20px)', background: 'rgba(255, 255, 255, 0.95)' } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Submit Moderation Decision Appeal</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Alert severity="warning" sx={{ borderRadius: '12px' }}>
              Targeting Decision Ref: <strong>{appealModalOpen?.id}</strong>
            </Alert>
            <TextField
              label="Dispute Reason"
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              fullWidth
            />
            <TextField
              label="Detailed Counter Explanation"
              multiline
              rows={4}
              value={appealExplanation}
              onChange={(e) => setAppealExplanation(e.target.value)}
              placeholder="Provide evidence and context supporting your appeal..."
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setAppealModalOpen(null)} sx={{ fontWeight: 800 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAppealSubmit} startIcon={<SendIcon />} sx={{ borderRadius: '12px', fontWeight: 900 }}>
            Submit Appeal
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

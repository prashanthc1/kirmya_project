'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DescriptionIcon from '@mui/icons-material/Description';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { trustSafetyApi } from '../../features/trust_safety/services/trustSafetyApi';
import { SafetyAppeal } from '../../features/trust_safety/types';

export const AppealsManagementDesk: React.FC = () => {
  const [appeals, setAppeals] = useState<SafetyAppeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppeal, setSelectedAppeal] = useState<SafetyAppeal | null>(null);
  const [resolveModal, setResolveModal] = useState<SafetyAppeal | null>(null);

  // Form states for resolution
  const [resolutionStatus, setResolutionStatus] = useState<'approved' | 'rejected'>('approved');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadAppeals = async () => {
    try {
      const data = await trustSafetyApi.getAppeals();
      setAppeals(data || []);
    } catch {
      setAppeals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppeals();
  }, []);

  const handleResolveSubmit = async () => {
    if (!resolveModal) return;
    await trustSafetyApi.resolveAppeal(resolveModal.id, resolutionStatus, resolutionNotes);
    setStatusMsg(`Appeal ${resolveModal.id} has been ${resolutionStatus.toUpperCase()}.`);
    setResolveModal(null);
    setResolutionNotes('');
    loadAppeals();
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

  const pendingCount = appeals.filter((a) => a.status === 'submitted' || a.status === 'under_review').length;
  const approvedCount = appeals.filter((a) => a.status === 'approved').length;
  const rejectedCount = appeals.filter((a) => a.status === 'rejected').length;

  return (
    <Stack spacing={3}>
      {/* Header & Metrics Summary */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
              PENDING APPEALS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'warning.main', mt: 0.5 }}>
              {pendingCount}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
              APPROVED APPEALS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'success.main', mt: 0.5 }}>
              {approvedCount}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
              REJECTED APPEALS
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'error.main', mt: 0.5 }}>
              {rejectedCount}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
              AVG DECISION TIME
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main', mt: 0.5 }}>
              2.4 hrs
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Main Appeals Card */}
      <Card
        sx={{
          borderRadius: '24px',
          p: 3,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssignmentTurnedInIcon color="primary" /> User Appeals Review Desk
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Review user dispute submissions, verify supporting documentation evidence, and render binding appeal verdicts.
            </Typography>
          </Box>
        </Stack>

        {statusMsg && (
          <Alert severity="success" onClose={() => setStatusMsg(null)} sx={{ mb: 2, borderRadius: '12px' }}>
            {statusMsg}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900 }}>Appeal ID / Decision Ref</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>User / Applicant</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Dispute Reason</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Submitted Date</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Reviewer</TableCell>
                  <TableCell sx={{ fontWeight: 900, textAlign: 'right' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appeals.map((app) => (
                  <TableRow key={app.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, fontFamily: 'monospace' }}>
                        {app.id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ref Decision: {app.decision_id}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        {app.user_name || app.user_id || 'User'}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {app.reason}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {app.explanation}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(app.submitted_at).toLocaleDateString()} {new Date(app.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </TableCell>

                    <TableCell>{getStatusChip(app.status)}</TableCell>

                    <TableCell>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {app.reviewer_name || app.reviewer_id || 'Unassigned'}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DescriptionIcon />}
                          onClick={() => setSelectedAppeal(app)}
                          sx={{ borderRadius: '8px', fontWeight: 800 }}
                        >
                          Details
                        </Button>
                        {(app.status === 'submitted' || app.status === 'under_review') && (
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => {
                              setResolveModal(app);
                              setResolutionStatus('approved');
                            }}
                            sx={{ borderRadius: '8px', fontWeight: 800 }}
                          >
                            Resolve Verdict
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Appeal Details Dialog */}
      <Dialog
        open={Boolean(selectedAppeal)}
        onClose={() => setSelectedAppeal(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ style: { borderRadius: 24, backdropFilter: 'blur(20px)', background: 'rgba(255, 255, 255, 0.95)' } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Appeal Evidence & Timeline</DialogTitle>
        <DialogContent dividers>
          {selectedAppeal && (
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
                  APPLICANT & DECISION REF
                </Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
                  {selectedAppeal.user_name || selectedAppeal.user_id} (Ref: {selectedAppeal.decision_id})
                </Typography>
              </Box>

              <Box sx={{ p: 2, borderRadius: '12px', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                  Dispute Reason & Explanation:
                </Typography>
                <Typography variant="body2">{selectedAppeal.explanation}</Typography>
              </Box>

              {selectedAppeal.evidence_urls && selectedAppeal.evidence_urls.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
                    Submitted Supporting Documents / URLs:
                  </Typography>
                  {selectedAppeal.evidence_urls.map((url, i) => (
                    <Chip key={i} icon={<OpenInNewIcon />} label={url} component="a" href={url} target="_blank" clickable size="small" sx={{ mr: 1, mb: 1 }} />
                  ))}
                </Box>
              )}

              {selectedAppeal.reviewer_notes && (
                <Alert severity="info" sx={{ borderRadius: '12px' }}>
                  <strong>Reviewer Notes:</strong> {selectedAppeal.reviewer_notes}
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setSelectedAppeal(null)} sx={{ fontWeight: 800 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Resolve Verdict Modal */}
      <Dialog
        open={Boolean(resolveModal)}
        onClose={() => setResolveModal(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ style: { borderRadius: 24, backdropFilter: 'blur(20px)', background: 'rgba(255, 255, 255, 0.95)' } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Render Appeal Verdict</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Typography variant="body2" color="text.secondary">
              Selecting verdict for Appeal <strong>{resolveModal?.id}</strong>. Approved appeals immediately lift associated penalties.
            </Typography>

            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant={resolutionStatus === 'approved' ? 'contained' : 'outlined'}
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => setResolutionStatus('approved')}
                sx={{ borderRadius: '12px', fontWeight: 900, flexGrow: 1 }}
              >
                Approve Appeal
              </Button>
              <Button
                variant={resolutionStatus === 'rejected' ? 'contained' : 'outlined'}
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setResolutionStatus('rejected')}
                sx={{ borderRadius: '12px', fontWeight: 900, flexGrow: 1 }}
              >
                Reject Appeal
              </Button>
            </Stack>

            <TextField
              label="Verdict Rationale & Resolution Notes"
              multiline
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Provide clear rationale for the user and audit log..."
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setResolveModal(null)} sx={{ fontWeight: 800 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleResolveSubmit} sx={{ borderRadius: '12px', fontWeight: 900 }}>
            Submit Final Verdict
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default AppealsManagementDesk;

'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Box,
  Link,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { safetyApi, resolveAppeal } from '../../../features/trust_safety/api';
import { SafetyAppeal } from '../../../features/trust_safety/types';

export const AppealsManager: React.FC = () => {
  const [appeals, setAppeals] = useState<SafetyAppeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppeal, setSelectedAppeal] = useState<SafetyAppeal | null>(null);

  const [resolutionStatus, setResolutionStatus] = useState<'approved' | 'rejected'>('approved');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadAppeals = async () => {
    try {
      const data = await safetyApi.getUserAppeals();
      setAppeals(data || []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppeals();
  }, []);

  const handleResolveSubmit = async () => {
    if (!selectedAppeal) return;
    await resolveAppeal({
      appeal_id: selectedAppeal.id,
      status: resolutionStatus,
      resolution_notes: reviewerNotes,
    });
    setStatusMsg(`Appeal ${selectedAppeal.id} marked as ${resolutionStatus.toUpperCase()}.`);
    setSelectedAppeal(null);
    setReviewerNotes('');
    loadAppeals();
  };

  return (
    <Card sx={{ borderRadius: '24px', p: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Moderation Appeals Review Console
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Review user-submitted decision appeals, examine provided credentials/evidence, and issue final rulings.
          </Typography>
        </Box>
      </Stack>

      {statusMsg && (
        <Alert severity="success" onClose={() => setStatusMsg(null)} sx={{ mb: 2, borderRadius: '12px' }}>
          {statusMsg}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Appeal ID / Decision Ref</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>User / Applicant</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Appeal Reason</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Explanation & Evidence</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Submitted Date</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {appeals.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
                      {a.id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ref: {a.decision_id}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{a.user_name || a.user_id || 'Applicant'}</TableCell>
                  <TableCell>
                    <Chip label={a.reason} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 280 }}>
                      {a.explanation}
                    </Typography>
                    {a.evidence_urls && a.evidence_urls.length > 0 && (
                      <Typography variant="caption" color="primary" sx={{ display: 'block' }}>
                        {a.evidence_urls.length} Evidence Link(s) Attached
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={a.status.toUpperCase()}
                      color={a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'error' : 'info'}
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
                  </TableCell>
                  <TableCell>{new Date(a.submitted_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      startIcon={<GavelIcon />}
                      onClick={() => setSelectedAppeal(a)}
                      sx={{ borderRadius: '8px', fontWeight: 800 }}
                    >
                      Resolve Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Resolve Appeal Dialog */}
      <Dialog open={Boolean(selectedAppeal)} onClose={() => setSelectedAppeal(null)} maxWidth="sm" fullWidth PaperProps={{ style: { borderRadius: 24 } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Resolve Moderation Appeal</DialogTitle>
        <DialogContent dividers>
          {selectedAppeal && (
            <Stack spacing={2.5}>
              <Box sx={{ bgcolor: 'action.hover', p: 2, borderRadius: '12px' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Appeal #{selectedAppeal.id} (Ref: {selectedAppeal.decision_id})
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Reason:</strong> {selectedAppeal.reason}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  <strong>Explanation:</strong> {selectedAppeal.explanation}
                </Typography>
              </Box>

              <FormControl fullWidth>
                <InputLabel>Resolution Decision</InputLabel>
                <Select
                  value={resolutionStatus}
                  label="Resolution Decision"
                  onChange={(e) => setResolutionStatus(e.target.value as 'approved' | 'rejected')}
                >
                  <MenuItem value="approved">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CheckCircleIcon color="success" fontSize="small" />
                      <Typography fontWeight={700}>Approve Appeal (Lift Enforcement Action)</Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="rejected">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CancelIcon color="error" fontSize="small" />
                      <Typography fontWeight={700}>Reject Appeal (Uphold Enforcement Action)</Typography>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Reviewer Explanation / Notes"
                multiline
                rows={3}
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder="Rationale for approval or rejection communicated to applicant..."
                fullWidth
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setSelectedAppeal(null)} sx={{ fontWeight: 800 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={resolutionStatus === 'approved' ? 'success' : 'error'}
            onClick={handleResolveSubmit}
            sx={{ borderRadius: '12px', fontWeight: 800 }}
          >
            Confirm Appeal Resolution
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default AppealsManager;

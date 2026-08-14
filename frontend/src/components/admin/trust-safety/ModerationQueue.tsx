'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
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
  Tooltip,
} from '@mui/material';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import GavelIcon from '@mui/icons-material/Gavel';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import WarningIcon from '@mui/icons-material/Warning';
import { safetyApi, claimCase, assignCase } from '../../../features/trust_safety/api';
import { SafetyCase } from '../../../features/trust_safety/types';

export const ModerationQueue: React.FC = () => {
  const [cases, setCases] = useState<SafetyCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionCase, setActionCase] = useState<SafetyCase | null>(null);
  const [assignCaseModal, setAssignCaseModal] = useState<SafetyCase | null>(null);

  // Form states for moderation action modal
  const [actionType, setActionType] = useState('warning');
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [durationDays, setDurationDays] = useState(7);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Form states for assign modal
  const [assigneeId, setAssigneeId] = useState('mod-tier2');
  const [assignTeam, setAssignTeam] = useState('tier-2-moderation');

  const loadCases = async () => {
    try {
      const data = await safetyApi.getSafetyCases();
      setCases(data || []);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, []);

  const handleClaim = async (caseId: string) => {
    await claimCase(caseId);
    setStatusMsg(`Case ${caseId} claimed successfully.`);
    loadCases();
  };

  const handleAssignSubmit = async () => {
    if (!assignCaseModal) return;
    await assignCase(assignCaseModal.id, assigneeId, assignTeam);
    setStatusMsg(`Case assigned to ${assigneeId} (${assignTeam}).`);
    setAssignCaseModal(null);
    loadCases();
  };

  const handleActionSubmit = async () => {
    if (!actionCase) return;
    await safetyApi.takeModerationAction({
      case_id: actionCase.id,
      target_id: actionCase.target_id,
      target_type: actionCase.target_type,
      action: actionType,
      reason: actionReason,
      notes: actionNotes,
      duration_days: durationDays,
    });
    setStatusMsg(`Enforcement action (${actionType.toUpperCase()}) executed for target ${actionCase.target_title || actionCase.target_id}.`);
    setActionCase(null);
    setActionReason('');
    setActionNotes('');
    loadCases();
  };

  const getRiskScoreBadge = (score: number) => {
    if (score >= 75) return <Chip label={`Risk: ${score}`} color="error" size="small" sx={{ fontWeight: 900 }} />;
    if (score >= 40) return <Chip label={`Risk: ${score}`} color="warning" size="small" sx={{ fontWeight: 900 }} />;
    return <Chip label={`Risk: ${score}`} color="success" size="small" sx={{ fontWeight: 900 }} />;
  };

  return (
    <Card sx={{ borderRadius: '24px', p: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Interactive Moderation Queue
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Review reported items, risk score flags, claim or assign cases, and trigger server-side moderation enforcement.
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
                <TableCell sx={{ fontWeight: 800 }}>Case Ref / Target</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Risk Score</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Reporter Privacy</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status / Assignment</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cases.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
                      {c.case_number || c.id}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {c.target_title || c.target_id} ({c.target_type.toUpperCase()})
                    </Typography>
                  </TableCell>
                  <TableCell>{getRiskScoreBadge(c.risk_score)}</TableCell>
                  <TableCell>
                    <Chip label={c.category.toUpperCase().replace('_', ' ')} variant="outlined" size="small" />
                  </TableCell>
                  <TableCell>
                    {c.reporter_privacy !== false ? (
                      <Tooltip title="Reporter identity protected">
                        <Chip
                          icon={<VisibilityOffIcon />}
                          label="Anonymous"
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                      </Tooltip>
                    ) : (
                      <Chip label="Identified" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Chip label={c.status.toUpperCase()} color="info" size="small" sx={{ fontWeight: 800, width: 'fit-content' }} />
                      {c.assigned_to && (
                        <Typography variant="caption" color="text.secondary">
                          Assignee: {c.assigned_to}
                        </Typography>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      {c.status === 'open' && (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<HowToRegIcon />}
                          onClick={() => handleClaim(c.id)}
                          sx={{ borderRadius: '8px', fontWeight: 800 }}
                        >
                          Claim
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PersonAddIcon />}
                        onClick={() => setAssignCaseModal(c)}
                        sx={{ borderRadius: '8px', fontWeight: 800 }}
                      >
                        Assign
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        startIcon={<GavelIcon />}
                        onClick={() => setActionCase(c)}
                        sx={{ borderRadius: '8px', fontWeight: 800 }}
                      >
                        Enforce
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Enforcement Action Modal */}
      <Dialog open={Boolean(actionCase)} onClose={() => setActionCase(null)} maxWidth="sm" fullWidth PaperProps={{ style: { borderRadius: 24 } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Enforce Moderation Action</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {actionCase && (
              <Alert severity="warning" icon={<WarningIcon />} sx={{ borderRadius: '12px' }}>
                Targeting: <strong>{actionCase.target_title || actionCase.target_id}</strong> ({actionCase.target_type.toUpperCase()})
              </Alert>
            )}

            <FormControl fullWidth>
              <InputLabel>Enforcement Action Type</InputLabel>
              <Select value={actionType} label="Enforcement Action Type" onChange={(e) => setActionType(e.target.value)}>
                <MenuItem value="warning">Official Policy Warning</MenuItem>
                <MenuItem value="content_removal">Content Removal / Hide Posting</MenuItem>
                <MenuItem value="temporary_restriction">Temporary Feature Restriction</MenuItem>
                <MenuItem value="suspension">Account Suspension</MenuItem>
                <MenuItem value="permanent_ban">Permanent Server-Side Ban</MenuItem>
                <MenuItem value="no_action">Dismiss / No Action Required</MenuItem>
              </Select>
            </FormControl>

            {(actionType === 'temporary_restriction' || actionType === 'suspension') && (
              <TextField
                label="Restriction Duration (Days)"
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                fullWidth
              />
            )}

            <TextField
              label="Policy Violation Reason"
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="e.g. Violation of recruitment scam policy (Rule ADVANCE-FEE)"
              fullWidth
            />

            <TextField
              label="Moderator Audit Notes"
              multiline
              rows={3}
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="Internal notes for audit log and compliance..."
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setActionCase(null)} sx={{ fontWeight: 800 }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleActionSubmit} sx={{ borderRadius: '12px', fontWeight: 800 }}>
            Execute Moderation Action
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Case Modal */}
      <Dialog open={Boolean(assignCaseModal)} onClose={() => setAssignCaseModal(null)} maxWidth="xs" fullWidth PaperProps={{ style: { borderRadius: 24 } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Assign Case to Team/Moderator</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <TextField
              label="Assignee Moderator ID"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Assigned Team</InputLabel>
              <Select value={assignTeam} label="Assigned Team" onChange={(e) => setAssignTeam(e.target.value)}>
                <MenuItem value="tier-1-triage">Tier 1 Triage Team</MenuItem>
                <MenuItem value="tier-2-moderation">Tier 2 Senior Moderation</MenuItem>
                <MenuItem value="legal-compliance">Legal & Compliance</MenuItem>
                <MenuItem value="anti-fraud-ops">Anti-Fraud Operations</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setAssignCaseModal(null)} sx={{ fontWeight: 800 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAssignSubmit} sx={{ borderRadius: '12px', fontWeight: 800 }}>
            Confirm Assignment
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ModerationQueue;

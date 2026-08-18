'use client';

import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Stack,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  Paper,
  IconButton,
  Tooltip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GavelIcon from '@mui/icons-material/Gavel';
import SecurityIcon from '@mui/icons-material/Security';
import HistoryIcon from '@mui/icons-material/History';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LinkIcon from '@mui/icons-material/Link';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { trustSafetyApi } from '../../features/trust_safety/services/trustSafetyApi';
import { SafetyCase } from '../../features/trust_safety/types';

interface CaseInvestigationDrawerProps {
  open: boolean;
  onClose: () => void;
  caseItem: SafetyCase | null;
  onActionExecuted?: () => void;
}

export const CaseInvestigationDrawer: React.FC<CaseInvestigationDrawerProps> = ({
  open,
  onClose,
  caseItem,
  onActionExecuted,
}) => {
  const [actionType, setActionType] = useState('warning');
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [durationDays, setDurationDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!caseItem) return null;

  const handleActionSubmit = async () => {
    setIsSubmitting(true);
    try {
      await trustSafetyApi.takeModerationAction({
        case_id: caseItem.id,
        target_id: caseItem.target_id,
        target_type: caseItem.target_type,
        action: actionType,
        reason: actionReason || `Policy action for category ${caseItem.category}`,
        notes: actionNotes,
        duration_days: durationDays,
      });

      await trustSafetyApi.updateCaseStatus(caseItem.id, 'actioned');
      setStatusMsg(`Enforcement action (${actionType.toUpperCase()}) executed successfully.`);
      if (onActionExecuted) onActionExecuted();
    } catch {
      setStatusMsg('Failed to execute action. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 75) return 'error';
    if (score >= 40) return 'warning';
    return 'success';
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 540, md: 620 },
          p: 3,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.2)',
        },
      }}
    >
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: 1 }}>
            CASE INVESTIGATION DESK
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon color="primary" /> {caseItem.case_number || caseItem.id}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      {statusMsg && (
        <Alert
          severity={statusMsg.includes('executed') ? 'success' : 'error'}
          onClose={() => setStatusMsg(null)}
          sx={{ mb: 2, borderRadius: '12px' }}
        >
          {statusMsg}
        </Alert>
      )}

      <Stack spacing={3} sx={{ overflowY: 'auto', pr: 1 }}>
        {/* Target Context Card */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '16px',
            background: 'rgba(0, 0, 0, 0.03)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: 'text.secondary' }}>
            TARGET ENTITY CONTEXT
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {caseItem.target_title || caseItem.target_id}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <Chip label={`Type: ${caseItem.target_type.toUpperCase()}`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
            <Chip label={`Category: ${caseItem.category.toUpperCase().replace('_', ' ')}`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
            <Chip label={`Priority: ${caseItem.priority.toUpperCase()}`} color={caseItem.priority === 'urgent' ? 'error' : 'warning'} size="small" sx={{ fontWeight: 800 }} />
          </Stack>

          <Box sx={{ mt: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 800 }}>
                RISK SCORE INDEX
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 900, color: `${getRiskColor(caseItem.risk_score)}.main` }}>
                {caseItem.risk_score} / 100
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={caseItem.risk_score}
              color={getRiskColor(caseItem.risk_score)}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        </Paper>

        {/* AI Safety Analysis & Recommendations */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '16px',
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, color: 'indigo', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AutoAwesomeIcon color="primary" fontSize="small" /> AI FRAUD & SAFETY ANALYSIS
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1.5 }}>
            {caseItem.ai_summary || 'AI Engine flagged suspicious behavior patterns requiring human verification.'}
          </Typography>
          {caseItem.ai_recommendation && (
            <Alert severity="info" icon={<CheckCircleIcon />} sx={{ borderRadius: '10px', fontSize: '0.85rem' }}>
              <strong>AI Recommendation:</strong> {caseItem.ai_recommendation}
            </Alert>
          )}
        </Paper>

        {/* Evidence & Report Attachments */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>
            EVIDENCE & USER REPORTS ({caseItem.reports_count || 1})
          </Typography>
          <List sx={{ background: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)' }}>
            {(caseItem.evidence || [
              { type: 'text', note: 'Advance payment request of $200 requested via wire transfer.' },
              { type: 'url', url: 'https://example.com/suspicious-link' },
            ]).map((item, idx) => (
              <ListItem key={idx} divider={idx < (caseItem.evidence?.length || 2) - 1}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <LinkIcon color="action" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.note || item.url}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                  secondary={`Evidence Type: ${item.type.toUpperCase()}`}
                />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Previous Violation History */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon fontSize="small" /> TARGET PREVIOUS VIOLATIONS ({caseItem.previous_violations_count || 0})
          </Typography>
          <Paper elevation={0} sx={{ p: 2, borderRadius: '12px', background: 'rgba(0,0,0,0.02)', border: '1px solid rgba(0,0,0,0.06)' }}>
            {caseItem.previous_violations_count && caseItem.previous_violations_count > 0 ? (
              <Typography variant="body2" color="error.main" sx={{ fontWeight: 700 }}>
                ⚠️ Target has {caseItem.previous_violations_count} prior policy violation record(s) on file.
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No previous policy infractions recorded for this user/entity.
              </Typography>
            )}
          </Paper>
        </Box>

        <Divider />

        {/* Enforcement Action Form */}
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <GavelIcon color="error" /> ENFORCEMENT ACTION FORM
          </Typography>

          <Stack spacing={2.5}>
            <FormControl fullWidth>
              <InputLabel>Enforcement Action Type</InputLabel>
              <Select value={actionType} label="Enforcement Action Type" onChange={(e) => setActionType(e.target.value)}>
                <MenuItem value="warning">Official Policy Warning</MenuItem>
                <MenuItem value="content_removal">Content Removal / Hide Post</MenuItem>
                <MenuItem value="temporary_restriction">Temporary Feature Restriction</MenuItem>
                <MenuItem value="suspension">Account Suspension</MenuItem>
                <MenuItem value="permanent_ban">Permanent Server-Side Ban</MenuItem>
                <MenuItem value="dismiss">Dismiss / No Action Required</MenuItem>
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
              placeholder="e.g. Violation of Rule POL-ADVANCE-FEE"
              fullWidth
            />

            <TextField
              label="Moderator Audit Notes"
              multiline
              rows={3}
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder="Internal compliance rationale and audit notes..."
              fullWidth
            />

            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ pt: 1 }}>
              <Button onClick={onClose} disabled={isSubmitting} sx={{ fontWeight: 800 }}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<GavelIcon />}
                onClick={handleActionSubmit}
                disabled={isSubmitting}
                sx={{ borderRadius: '12px', fontWeight: 900, px: 3, py: 1.2 }}
              >
                {isSubmitting ? 'Executing...' : 'Execute Moderation Action'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Drawer>
  );
};

export default CaseInvestigationDrawer;

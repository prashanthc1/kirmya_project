'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Typography,
  Alert,
  Box,
  CircularProgress,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import TimerIcon from '@mui/icons-material/Timer';
import StopCircleIcon from '@mui/icons-material/StopCircle';

import { adminApi } from '../../features/admin/services/adminApi';
import { UserImpersonationSessionDTO, SupportImpersonationRequestDTO } from '../../features/admin/types';

export interface ImpersonationDialogProps {
  open: boolean;
  onClose: () => void;
  targetUser?: { id: string; name?: string; email: string };
  onStartSession?: (session: UserImpersonationSessionDTO) => void;
}

export const ImpersonationDialog: React.FC<ImpersonationDialogProps> = ({
  open,
  onClose,
  targetUser,
  onStartSession,
}) => {
  const [reason, setReason] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [submitting, setSubmitting] = useState(false);
  const [activeSession, setActiveSession] = useState<UserImpersonationSessionDTO | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Countdown timer effect for active session
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession && activeSession.status === 'active') {
      const calculateRemaining = () => {
        const diff = Math.max(0, Math.floor((new Date(activeSession.expiresAt).getTime() - Date.now()) / 1000));
        setRemainingSeconds(diff);
        if (diff === 0) {
          setActiveSession((prev) => (prev ? { ...prev, status: 'expired' } : null));
        }
      };
      calculateRemaining();
      interval = setInterval(calculateRemaining, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession]);

  const handleStartImpersonation = async () => {
    if (!targetUser || reason.trim().length < 10) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const payload: SupportImpersonationRequestDTO = {
        targetUserId: targetUser.id,
        reason: reason.trim(),
        durationMinutes,
      };
      const session = await adminApi.requestSupportImpersonation(payload);
      setActiveSession(session);
      if (onStartSession) {
        onStartSession(session);
      }
      setFeedback('Support impersonation session activated.');
    } catch {
      setFeedback('Failed to start support impersonation session.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTerminateSession = async () => {
    if (!activeSession) return;
    setSubmitting(true);
    try {
      await adminApi.terminateImpersonationSession(activeSession.id);
      setActiveSession((prev) => (prev ? { ...prev, status: 'terminated' } : null));
      setFeedback('Impersonation session terminated.');
    } catch {
      setFeedback('Failed to terminate session.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth paperProps-sx={{ borderRadius: '24px' }}>
      <DialogTitle sx={{ fontWeight: 900, pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <SupervisorAccountIcon color="secondary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Support Account Impersonation
          </Typography>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Stack spacing={3}>
          {feedback && (
            <Alert severity="info" onClose={() => setFeedback(null)} sx={{ borderRadius: '12px' }}>
              {feedback}
            </Alert>
          )}

          {/* Audit Logging Notice */}
          <Alert severity="warning" icon={<SecurityIcon />} sx={{ borderRadius: '12px' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Immutable Compliance Audit Notice
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
              All administrative actions, page views, and API calls performed during support impersonation are immutably logged to the security audit trail.
            </Typography>
          </Alert>

          {targetUser && (
            <Paper elevation={0} sx={{ p: 2, borderRadius: '14px', bgcolor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Target User Account
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {targetUser.name || 'User'} ({targetUser.email})
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                User ID: {targetUser.id}
              </Typography>
            </Paper>
          )}

          {activeSession && activeSession.status === 'active' ? (
            /* Active Session View with Live Countdown Timer */
            <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', textAlign: 'center', bgcolor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <Chip label="ACTIVE SESSION" color="success" sx={{ fontWeight: 900, mb: 2 }} />
              <Typography variant="h3" sx={{ fontWeight: 900, fontFamily: 'monospace', color: '#10b981', my: 1 }}>
                {formatCountdown(remainingSeconds)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Time remaining before session automatically expires.
              </Typography>
              <Button
                variant="contained"
                color="error"
                startIcon={<StopCircleIcon />}
                onClick={handleTerminateSession}
                disabled={submitting}
                sx={{ borderRadius: '12px', fontWeight: 800 }}
              >
                Terminate Impersonation
              </Button>
            </Paper>
          ) : (
            /* Form view to initiate impersonation */
            <Stack spacing={2.5}>
              <TextField
                label="Duration (Minutes)"
                select
                fullWidth
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              >
                <MenuItem value={15}>15 Minutes</MenuItem>
                <MenuItem value={30}>30 Minutes</MenuItem>
                <MenuItem value={60}>60 Minutes (1 Hour)</MenuItem>
                <MenuItem value={120}>120 Minutes (2 Hours)</MenuItem>
              </TextField>

              <TextField
                label="Justification / Ticket Reason (Min 10 characters)"
                multiline
                rows={3}
                fullWidth
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Resolving support ticket #9812 - user unable to view job application status"
                error={reason.length > 0 && reason.trim().length < 10}
                helperText={
                  reason.length > 0 && reason.trim().length < 10
                    ? 'Please provide a detailed justification (at least 10 characters).'
                    : 'Required for compliance audit verification.'
                }
              />
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} sx={{ borderRadius: '10px' }}>
          Close
        </Button>
        {(!activeSession || activeSession.status !== 'active') && (
          <Button
            variant="contained"
            color="secondary"
            onClick={handleStartImpersonation}
            disabled={submitting || reason.trim().length < 10 || !targetUser}
            sx={{ borderRadius: '10px', fontWeight: 800, px: 3 }}
          >
            {submitting ? <CircularProgress size={20} /> : 'Start Impersonation'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ImpersonationDialog;

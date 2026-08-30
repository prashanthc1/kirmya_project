'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Stack,
  MenuItem,
  Alert,
} from '@mui/material';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import { tokens } from '../../theme/tokens';
import { networkingApi } from '../../features/networking/services/networkingApi';

interface ReportUserModalProps {
  open: boolean;
  userId: string;
  userName: string;
  onClose: () => void;
}

const reportReasons = [
  { value: 'spam_harassment', label: 'Spam, harassment, or unwanted commercial outreach' },
  { value: 'fake_profile', label: 'Impersonation, scam, or fake identity' },
  { value: 'inappropriate_content', label: 'Inappropriate or harmful professional content' },
  { value: 'policy_violation', label: 'Violation of Kirmya Community Guidelines' },
  { value: 'other', label: 'Other violation' },
];

export const ReportUserModal: React.FC<ReportUserModalProps> = ({
  open,
  userId,
  userName,
  onClose,
}) => {
  const [reason, setReason] = useState('spam_harassment');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setLoading(true);
    try {
      await networkingApi.reportUser(userId, reason, details);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDetails('');
        onClose();
      }, 1500);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: `${tokens.radius.lg}px`,
          p: 1.5,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, letterSpacing: '-0.01em', pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <FlagOutlinedIcon color="warning" />
          <span>Report {userName}</span>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ my: 2, borderRadius: `${tokens.radius.sm}px` }}>
            Thank you. Your report has been submitted to the Trust & Safety team for review.
          </Alert>
        ) : (
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Help us maintain a safe and trustworthy professional community. Reports are strictly confidential.
            </Typography>

            <TextField
              select
              label="Reason for report"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              fullWidth
              variant="outlined"
            >
              {reportReasons.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Additional details (optional)"
              placeholder="Provide additional context or links to help our review team..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              multiline
              rows={3}
              fullWidth
              variant="outlined"
            />
          </Stack>
        )}
      </DialogContent>

      {!success && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            disabled={loading}
            sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="warning"
            disabled={loading || !reason}
            sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700 }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Submit Report'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ReportUserModal;

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import { tokens } from '../../theme/tokens';

interface MessageReportDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => void;
}

export const MessageReportDialog: React.FC<MessageReportDialogProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');

  const handleSubmit = () => {
    onSubmit(reason, details);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
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
          <span>Report Message / Conversation</span>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Submit a confidential report to Kirmya Trust & Safety for review. We investigate all harassment, scams, and policy violations.
          </Typography>

          <FormControl fullWidth>
            <InputLabel id="report-reason-label">Reason for Report</InputLabel>
            <Select
              labelId="report-reason-label"
              value={reason}
              label="Reason for Report"
              onChange={(e) => setReason(e.target.value)}
            >
              <MenuItem value="spam">Spam / Unsolicited Promotion</MenuItem>
              <MenuItem value="harassment">Harassment or Abuse</MenuItem>
              <MenuItem value="scam">Scam / Financial Fraud</MenuItem>
              <MenuItem value="impersonation">Impersonation or Fake Profile</MenuItem>
              <MenuItem value="inappropriate">Inappropriate or Harmful Content</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Additional Details (Optional)"
            multiline
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Describe the issue or provide context..."
            variant="outlined"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="warning"
          sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700 }}
        >
          Submit Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MessageReportDialog;

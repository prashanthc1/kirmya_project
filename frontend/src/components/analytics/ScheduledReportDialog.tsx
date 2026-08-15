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
  Box,
  Stack,
  MenuItem,
  Alert,
  Chip,
} from '@mui/material';
import ScheduleSendIcon from '@mui/icons-material/ScheduleSend';
import analyticsApi from '../../features/analytics/services/analyticsApi';

interface ScheduledReportDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (newReport: any) => void;
}

export default function ScheduledReportDialog({ open, onClose, onCreated }: ScheduledReportDialogProps) {
  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState('platform_overview');
  const [cronExpression, setCronExpression] = useState('0 0 * * 1');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [recipientsInput, setRecipientsInput] = useState('executives@kirmya.org');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cronPresets = [
    { label: 'Weekly (Monday Midnight)', value: '0 0 * * 1' },
    { label: 'Daily (Midnight)', value: '0 0 * * *' },
    { label: 'Monthly (1st of Month)', value: '0 0 1 * *' },
    { label: 'Bi-Weekly', value: '0 0 1,15 * *' },
  ];

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMsg('Report title is required.');
      return;
    }
    if (!cronExpression.trim()) {
      setErrorMsg('Cron expression schedule is required.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const recipients = recipientsInput
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    const payload = {
      title,
      report_type: reportType,
      cron_expression: cronExpression,
      export_format: exportFormat,
      recipients,
    };

    const res = await analyticsApi.createScheduledReport(payload);
    setSubmitting(false);
    if (onCreated) {
      onCreated(res);
    }
    onClose();
    // Reset form
    setTitle('');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <ScheduleSendIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h6" fontWeight={900}>
              Schedule Executive Automated Digest
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Configure automated cron-scheduled analytics reports delivered via email/webhook.
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>
            {errorMsg}
          </Alert>
        )}

        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Report Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Weekly Platform Growth & Hiring Conversion Digest"
            fullWidth
            required
            size="small"
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              select
              label="Report Category"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              fullWidth
              size="small"
            >
              <MenuItem value="platform_overview">Platform Executive Overview</MenuItem>
              <MenuItem value="hiring_funnel">Recruitment &amp; Application Funnel</MenuItem>
              <MenuItem value="job_market_skills">Skill Demand &amp; Job Market</MenuItem>
              <MenuItem value="system_performance">Infrastructure Telemetry &amp; SLA</MenuItem>
              <MenuItem value="trust_safety">Trust &amp; Safety Moderation Summary</MenuItem>
            </TextField>

            <TextField
              select
              label="Export Format"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as any)}
              fullWidth
              size="small"
            >
              <MenuItem value="csv">CSV Spreadsheet</MenuItem>
              <MenuItem value="json">JSON Dataset</MenuItem>
              <MenuItem value="pdf">PDF Document</MenuItem>
            </TextField>
          </Stack>

          <Box>
            <Typography variant="subtitle2" fontWeight={800} gutterBottom>
              Cron Schedule Expression
            </Typography>
            <TextField
              value={cronExpression}
              onChange={(e) => setCronExpression(e.target.value)}
              placeholder="0 0 * * 1"
              fullWidth
              size="small"
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              Presets:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
              {cronPresets.map((preset) => (
                <Chip
                  key={preset.value}
                  label={preset.label}
                  size="small"
                  onClick={() => setCronExpression(preset.value)}
                  color={cronExpression === preset.value ? 'primary' : 'default'}
                  sx={{ cursor: 'pointer', mb: 0.5 }}
                />
              ))}
            </Stack>
          </Box>

          <TextField
            label="Recipients (Comma separated emails)"
            value={recipientsInput}
            onChange={(e) => setRecipientsInput(e.target.value)}
            placeholder="executives@kirmya.org, cto@kirmya.org"
            fullWidth
            size="small"
            multiline
            rows={2}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 3 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          sx={{ borderRadius: 3, fontWeight: 800 }}
        >
          {submitting ? 'Scheduling...' : 'Create Cron Digest'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

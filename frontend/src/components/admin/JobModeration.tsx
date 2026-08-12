'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Chip,
  Button,
  Stack,
  TextField,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

export const JobModeration: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [jobs, setJobs] = useState([
    {
      id: 'j1',
      title: 'Senior Go Backend Architect',
      company: 'TechCorp Middle East',
      location: 'Dubai, UAE (Hybrid)',
      salary: '$120,000 - $145,000 / yr',
      status: 'Under Review',
      riskScore: 0.12,
      riskLevel: 'Low',
      description: 'Lead backend services in Go with PostgreSQL and Redis...',
      createdAt: '2026-08-11',
    },
    {
      id: 'j2',
      title: 'Remote Data Entry & Processing - High Weekly Pay',
      company: 'Apex Global Logistics',
      location: 'Remote',
      salary: '$4,500 / week',
      status: 'Flagged',
      riskScore: 0.92,
      riskLevel: 'Critical',
      description: 'Requires candidate to wire initial equipment fee of $250 for home office setup...',
      createdAt: '2026-08-12',
    },
  ]);

  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [dialogAction, setDialogAction] = useState<string>('Approve');
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleOpenDialog = (job: any, action: string) => {
    setSelectedJob(job);
    setDialogAction(action);
    setModerationReason('');
    setDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (!selectedJob) return;
    setJobs((prev) =>
      prev.map((j) => (j.id === selectedJob.id ? { ...j, status: dialogAction === 'Approve' ? 'Approved' : 'Removed' } : j))
    );
    setDialogOpen(false);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
        Job Listing Moderation Queue
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Review job posts for recruitment scams, fee collection fraud, spam, and policy violations.
      </Typography>

      <Stack spacing={3}>
        {jobs.map((job) => (
          <Paper
            key={job.id}
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '20px',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid',
              borderColor: job.riskLevel === 'Critical' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.12)',
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 900 }}>
                    {job.title}
                  </Typography>
                  <Chip
                    label={`Risk: ${job.riskLevel} (${(job.riskScore * 100).toFixed(0)}%)`}
                    size="small"
                    color={job.riskLevel === 'Critical' ? 'error' : 'success'}
                    sx={{ fontWeight: 900 }}
                  />
                  <Chip label={job.status} size="small" variant="outlined" sx={{ fontWeight: 800 }} />
                </Stack>

                <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 800, mb: 1 }}>
                  {job.company} • {job.location} • {job.salary}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {job.description}
                </Typography>
              </Grid>

              <Grid item xs={12} md={4}>
                <Stack spacing={1.5} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleOpenDialog(job, 'Approve')}
                    sx={{ borderRadius: '12px', fontWeight: 800 }}
                  >
                    Approve Job
                  </Button>
                  <Button
                    fullWidth
                    variant="contained"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => handleOpenDialog(job, 'Remove')}
                    sx={{ borderRadius: '12px', fontWeight: 800 }}
                  >
                    Remove Scam Listing
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>
        ))}
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>
          {dialogAction} Job Listing
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Target job: <strong>{selectedJob?.title}</strong>
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Audit Reason *"
            value={moderationReason}
            onChange={(e) => setModerationReason(e.target.value)}
            placeholder="Explain moderation decision for immutable audit logs..."
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={dialogAction === 'Approve' ? 'success' : 'error'}
            disabled={!moderationReason}
            onClick={handleConfirmAction}
            sx={{ fontWeight: 800 }}
          >
            Confirm Decision
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobModeration;

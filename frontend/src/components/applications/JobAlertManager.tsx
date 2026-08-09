'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  IconButton,
  Chip,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  MenuItem,
  Stack,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import { JobAlertDTO, CreateJobAlertPayload } from '@/features/applications/types';

interface JobAlertManagerProps {
  alerts: JobAlertDTO[];
  onCreateAlert: (payload: CreateJobAlertPayload) => void;
  onDeleteAlert: (id: string) => void;
}

export const JobAlertManager: React.FC<JobAlertManagerProps> = ({ alerts, onCreateAlert, onDeleteAlert }) => {
  const [openModal, setOpenModal] = useState(false);
  const [title, setTitle] = useState('');
  const [keywords, setKeywords] = useState('');
  const [location, setLocation] = useState('');
  const [frequency, setFrequency] = useState('Daily');

  const handleSubmit = () => {
    onCreateAlert({
      title: title || 'Custom Job Alert',
      keywords,
      job_titles: ['Software Engineer'],
      skills: ['React', 'TypeScript'],
      location,
      industry: 'Technology',
      salary_min: 120000,
      salary_max: 200000,
      employment_type: 'Full-time',
      frequency,
      channel_email: true,
      channel_push: true,
      channel_in_app: true,
    });
    setOpenModal(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Job Alert Preferences
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Create Job Alert
        </Button>
      </Box>

      <Grid container spacing={3}>
        {alerts.map((alert) => (
          <Grid item xs={12} md={6} key={alert.id}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <NotificationsActiveIcon sx={{ color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.05rem' }}>
                    {alert.title}
                  </Typography>
                </Box>
                <IconButton onClick={() => onDeleteAlert(alert.id)} sx={{ color: 'error.main' }}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>

              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Keywords: &ldquo;{alert.keywords}&rdquo; &bull; Location: {alert.location || 'Remote'}
              </Typography>

              <Stack direction="row" spacing={1} sx={{ mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
                <Chip label={`Frequency: ${alert.frequency}`} size="small" variant="outlined" />
                <Chip label="Email Enabled" size="small" color="primary" />
                <Chip label="Push Enabled" size="small" color="secondary" />
              </Stack>

              <FormControlLabel
                control={<Switch checked={alert.is_active} size="small" color="primary" />}
                label={alert.is_active ? 'Active Notification Delivery' : 'Paused'}
              />
            </Paper>
          </Grid>
        ))}

        {alerts.length === 0 && (
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, background: 'rgba(255,255,255,0.02)' }}>
              <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                No active job alerts configured
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                Set up automated search alerts to get instant notifications when relevant opportunities are published.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Configure New Job Alert</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Alert Title"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Staff Frontend Roles"
            />
            <TextField
              label="Keywords & Skills"
              fullWidth
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="React, TypeScript, MUI, Next.js"
            />
            <TextField
              label="Preferred Location"
              fullWidth
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Remote / San Francisco, CA"
            />
            <TextField
              select
              label="Notification Frequency"
              fullWidth
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              <MenuItem value="Instant">Instant (Real-time)</MenuItem>
              <MenuItem value="Daily">Daily Summary</MenuItem>
              <MenuItem value="Weekly">Weekly Digest</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Save Alert
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

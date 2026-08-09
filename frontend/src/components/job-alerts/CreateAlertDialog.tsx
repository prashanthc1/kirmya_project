'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  FormControlLabel,
  Checkbox,
  Typography,
  Box,
  Stack,
  Chip,
} from '@mui/material';
import { JobAlert } from '@/features/job-alerts/types';

interface CreateAlertDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (alert: Partial<JobAlert>) => void;
  initialAlert?: JobAlert | null;
}

export const CreateAlertDialog: React.FC<CreateAlertDialogProps> = ({
  open,
  onClose,
  onSubmit,
  initialAlert,
}) => {
  const [title, setTitle] = useState(initialAlert?.title || '');
  const [keywords, setKeywords] = useState(initialAlert?.keywords || '');
  const [location, setLocation] = useState(initialAlert?.location || '');
  const [employmentType, setEmploymentType] = useState(initialAlert?.employment_type || 'Full-time');
  const [experienceLevel, setExperienceLevel] = useState(initialAlert?.experience_level || 'Mid-Level');
  const [remotePreference, setRemotePreference] = useState(initialAlert?.remote_preference || 'Remote');
  const [salaryMin, setSalaryMin] = useState(initialAlert?.salary_min || 120000);
  const [salaryMax, setSalaryMax] = useState(initialAlert?.salary_max || 200000);
  const [frequency, setFrequency] = useState<JobAlert['frequency']>(initialAlert?.frequency || 'Daily');
  const [channelEmail, setChannelEmail] = useState(initialAlert?.channel_email ?? true);
  const [channelPush, setChannelPush] = useState(initialAlert?.channel_push ?? true);
  const [channelInApp, setChannelInApp] = useState(initialAlert?.channel_in_app ?? true);

  const handleSave = () => {
    onSubmit({
      title: title || 'Custom Job Alert',
      keywords,
      location,
      employment_type: employmentType,
      experience_level: experienceLevel,
      remote_preference: remotePreference,
      salary_min: Number(salaryMin),
      salary_max: Number(salaryMax),
      frequency,
      channel_email: channelEmail,
      channel_push: channelPush,
      channel_in_app: channelInApp,
      skills: ['React', 'TypeScript', 'Golang'],
      job_titles: ['Software Engineer', 'Full Stack Developer'],
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        {initialAlert ? 'Edit Job Alert Preferences' : 'Create Production Job Alert'}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2.5}>
          <Grid item xs={12}>
            <TextField
              label="Alert Name"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Senior Full-Stack Engineer Roles"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Keywords / Target Roles"
              fullWidth
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="React, TypeScript, Golang, Next.js"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Preferred Location / City"
              fullWidth
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="San Francisco, CA or Remote"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="Employment Type"
              fullWidth
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
            >
              <MenuItem value="Full-time">Full-time</MenuItem>
              <MenuItem value="Part-time">Part-time</MenuItem>
              <MenuItem value="Contract">Contract</MenuItem>
              <MenuItem value="Freelance">Freelance</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="Experience Level"
              fullWidth
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
            >
              <MenuItem value="Entry-Level">Entry-Level</MenuItem>
              <MenuItem value="Mid-Level">Mid-Level</MenuItem>
              <MenuItem value="Senior">Senior</MenuItem>
              <MenuItem value="Lead / Staff">Lead / Staff</MenuItem>
              <MenuItem value="Executive">Executive</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="Remote Preference"
              fullWidth
              value={remotePreference}
              onChange={(e) => setRemotePreference(e.target.value)}
            >
              <MenuItem value="Remote">100% Remote</MenuItem>
              <MenuItem value="Hybrid">Hybrid</MenuItem>
              <MenuItem value="On-site">On-site</MenuItem>
              <MenuItem value="Flexible">Flexible</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Minimum Expected Salary ($)"
              type="number"
              fullWidth
              value={salaryMin}
              onChange={(e) => setSalaryMin(Number(e.target.value))}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Maximum Target Salary ($)"
              type="number"
              fullWidth
              value={salaryMax}
              onChange={(e) => setSalaryMax(Number(e.target.value))}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Notification Frequency"
              fullWidth
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as JobAlert['frequency'])}
            >
              <MenuItem value="Immediately">Immediately (Real-time)</MenuItem>
              <MenuItem value="Every Hour">Every Hour</MenuItem>
              <MenuItem value="Daily">Daily Summary</MenuItem>
              <MenuItem value="Weekly">Weekly Digest</MenuItem>
              <MenuItem value="Custom">Custom Schedule</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Notification Delivery Channels
            </Typography>
            <Stack direction="row" spacing={3}>
              <FormControlLabel
                control={<Checkbox checked={channelEmail} onChange={(e) => setChannelEmail(e.target.checked)} color="primary" />}
                label="Email Digest"
              />
              <FormControlLabel
                control={<Checkbox checked={channelPush} onChange={(e) => setChannelPush(e.target.checked)} color="primary" />}
                label="Mobile Push Notification"
              />
              <FormControlLabel
                control={<Checkbox checked={channelInApp} onChange={(e) => setChannelInApp(e.target.checked)} color="primary" />}
                label="In-App Notification Badge"
              />
            </Stack>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} sx={{ borderRadius: 2, fontWeight: 700 }}>
          {initialAlert ? 'Update Alert' : 'Create Alert'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

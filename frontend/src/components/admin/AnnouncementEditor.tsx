'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  TextField,
  MenuItem,
  Button,
  Stack,
  Alert,
  FormGroup,
  FormControlLabel,
  Checkbox,
  useTheme,
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import SendIcon from '@mui/icons-material/Send';
import { adminApi } from '../../features/admin/services/adminApi';

export const AnnouncementEditor: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState('All Active Users');
  const [priority, setPriority] = useState('Normal');
  const [inApp, setInApp] = useState(true);
  const [email, setEmail] = useState(false);
  const [push, setPush] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title || !content) {
      setError('Title and message content are required.');
      return;
    }
    setError(null);

    const channels: string[] = [];
    if (inApp) channels.push('in_app');
    if (email) channels.push('email');
    if (push) channels.push('push');

    try {
      await adminApi.createAnnouncement({
        title,
        content,
        audience,
        priority,
        channels,
      });
      setSuccess('Platform announcement dispatched successfully via prompt 35 notification center.');
      setTitle('');
      setContent('');
    } catch (e: any) {
      setError(e?.message || 'Failed to dispatch announcement.');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 800, mx: 'auto' }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
        <CampaignIcon sx={{ fontSize: 36, color: 'primary.main' }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Platform Announcement Broadcast
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Dispatch targeted system notifications, maintenance windows, and feature releases to user groups.
          </Typography>
        </Box>
      </Stack>

      <Card
        sx={{
          borderRadius: '24px',
          p: { xs: 3, md: 5 },
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>{success}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

        <Stack spacing={3}>
          <TextField
            label="Announcement Header / Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Scheduled System Maintenance Notice..."
            fullWidth
            required
          />

          <TextField
            select
            label="Target Audience Segment"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            fullWidth
          >
            <MenuItem value="All Active Users">All Active Users (12,450)</MenuItem>
            <MenuItem value="Verified Users">Verified Users Only (8,900)</MenuItem>
            <MenuItem value="Recruiters">Recruiters &amp; Employers (3,200)</MenuItem>
            <MenuItem value="Professionals">Job Seekers &amp; Candidates (9,250)</MenuItem>
            <MenuItem value="Administrators">System Administrators (15)</MenuItem>
          </TextField>

          <TextField
            select
            label="Urgency &amp; Priority Level"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            fullWidth
          >
            <MenuItem value="Low">Low (General Update)</MenuItem>
            <MenuItem value="Normal">Normal (Standard Notification)</MenuItem>
            <MenuItem value="High">High (Important Policy / Feature)</MenuItem>
            <MenuItem value="Urgent">Urgent (Critical System Alert)</MenuItem>
          </TextField>

          <TextField
            label="Message Payload Content"
            multiline
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write full announcement details..."
            fullWidth
            required
          />

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
              Delivery Channels (Integrated Prompt 35 Infrastructure)
            </Typography>
            <FormGroup row>
              <FormControlLabel control={<Checkbox checked={inApp} onChange={(e) => setInApp(e.target.checked)} />} label="In-App Bell Alert" />
              <FormControlLabel control={<Checkbox checked={email} onChange={(e) => setEmail(e.target.checked)} />} label="Email Broadcast" />
              <FormControlLabel control={<Checkbox checked={push} onChange={(e) => setPush(e.target.checked)} />} label="Push Notification" />
            </FormGroup>
          </Box>

          <Button
            variant="contained"
            onClick={handleSubmit}
            endIcon={<SendIcon />}
            sx={{ borderRadius: '12px', fontWeight: 800, py: 1.5, fontSize: '1rem' }}
          >
            Dispatch Announcement
          </Button>
        </Stack>
      </Card>
    </Box>
  );
};

export default AnnouncementEditor;

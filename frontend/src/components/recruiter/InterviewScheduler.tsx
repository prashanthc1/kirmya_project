'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  Stack,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  useTheme,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import VideoCameraFrontIcon from '@mui/icons-material/VideoCameraFront';
import AddIcon from '@mui/icons-material/Add';
import GlassCard from '../landing/GlassCard';
import { InterviewItem } from '../../features/recruiter/types';
import { recruiterApi } from '../../features/recruiter/api';

interface InterviewSchedulerProps {
  interviews?: InterviewItem[];
  onScheduled?: () => void;
}

const mockInterviews: InterviewItem[] = [
  {
    id: 'int_1',
    jobId: '11111111-1111-1111-1111-111111111111',
    candidateId: 'c1111111-1111-1111-1111-111111111111',
    candidateName: 'Sarah Chen',
    type: 'Video',
    scheduledAt: '2026-08-15T10:00:00Z',
    durationMinutes: 45,
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    notes: 'Technical Systems Architecture Round',
  },
];

export const InterviewScheduler: React.FC<InterviewSchedulerProps> = ({ interviews = mockInterviews, onScheduled }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [openModal, setOpenModal] = useState(false);

  const [form, setForm] = useState({
    candidateName: 'Sarah Chen',
    jobId: '11111111-1111-1111-1111-111111111111',
    candidateId: 'c1111111-1111-1111-1111-111111111111',
    type: 'Video',
    scheduledAt: '2026-08-05T10:00',
    durationMinutes: 45,
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    notes: 'Technical Systems Architecture Deep Dive',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await recruiterApi.scheduleInterview(form);
      setOpenModal(false);
      onScheduled?.();
    } catch {
      setOpenModal(false);
      onScheduled?.();
    }
  };

  return (
    <GlassCard sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <EventIcon sx={{ color: '#ec4899', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Scheduled Interviews ({interviews.length})
          </Typography>
        </Stack>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
          sx={{ py: 1, px: 3, borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
        >
          Schedule Interview
        </Button>
      </Stack>

      <Grid container spacing={2.5}>
        {interviews.map((item) => (
          <Grid item xs={12} md={6} key={item.id}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {item.candidateName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.notes}
                  </Typography>
                </Box>
                <Chip label={item.type} size="small" color="primary" sx={{ fontWeight: 800 }} />
              </Stack>

              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <EventIcon fontSize="small" color="action" />
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {new Date(item.scheduledAt).toLocaleString()}
                  </Typography>
                </Box>
                <Chip label={`${item.durationMinutes} Min`} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
              </Stack>

              {item.meetingLink && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<VideoCameraFrontIcon />}
                  component="a"
                  href={item.meetingLink}
                  target="_blank"
                  sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                >
                  Join Meeting
                </Button>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Modal Dialog for Scheduling */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 900 }}>Schedule New Interview Session</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField label="Candidate Name *" fullWidth value={form.candidateName} onChange={(e) => setForm({ ...form, candidateName: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Interview Type *" fullWidth value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <MenuItem value="Video">Video Call</MenuItem>
                  <MenuItem value="Phone">Phone Call</MenuItem>
                  <MenuItem value="In-person">In-person Office</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={8}>
                <TextField label="Date & Time *" type="datetime-local" InputLabelProps={{ shrink: true }} fullWidth value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Duration (Min)" type="number" fullWidth value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: Number(e.target.value) })} />
              </Grid>

              <Grid item xs={12}>
                <TextField label="Meeting Link / Location" fullWidth value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} />
              </Grid>

              <Grid item xs={12}>
                <TextField label="Interview Agenda / Notes" multiline rows={2} fullWidth value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </Grid>
            </Grid>

            <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
              <Button variant="text" onClick={() => setOpenModal(false)} sx={{ fontWeight: 700 }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" sx={{ borderRadius: '10px', fontWeight: 800, textTransform: 'none' }}>
                Schedule Interview
              </Button>
            </Stack>
          </form>
        </DialogContent>
      </Dialog>
    </GlassCard>
  );
};

export default InterviewScheduler;

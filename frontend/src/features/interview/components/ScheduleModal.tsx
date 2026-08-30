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
  Box,
  Typography,
  IconButton,
  Chip,
  Paper,
  Divider,
  Alert,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EventIcon from '@mui/icons-material/Event';
import GroupIcon from '@mui/icons-material/Group';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import { CreateInterviewPayload } from '../types';
import { tokens } from '../../../theme/tokens';

interface ScheduleModalProps {
  open: boolean;
  onClose: () => void;
  onSchedule: (payload: CreateInterviewPayload) => Promise<void>;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  open,
  onClose,
  onSchedule,
}) => {
  const [title, setTitle] = useState('Senior Fullstack Engineer Technical Interview');
  const [candidateId, setCandidateId] = useState('11111111-1111-1111-1111-111111111111');
  const [candidateName, setCandidateName] = useState('Alex Rivera');
  const [jobTitle, setJobTitle] = useState('Senior Full Stack Engineer');
  const [locationType, setLocationType] = useState<'virtual' | 'in_person' | 'phone'>('virtual');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/abc-defg-hij');
  const [notes, setNotes] = useState('Focus on system architecture, database modeling, and React optimization.');

  // Dates
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  tomorrow.setHours(14, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow.getTime() + 60 * 60 * 1000);

  const [startDate, setStartDate] = useState(tomorrow.toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState(tomorrowEnd.toISOString().slice(0, 16));

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleScheduleSubmit = async () => {
    try {
      setSubmitting(true);
      setErrorMsg('');

      const payload: CreateInterviewPayload = {
        candidate_id: candidateId,
        title,
        scheduled_start: new Date(startDate).toISOString(),
        scheduled_end: new Date(endDate).toISOString(),
        location_type: locationType,
        meeting_link: meetingLink,
        notes,
      };

      await onSchedule(payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Failed to schedule interview');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <EventIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Schedule Candidate Interview
          </Typography>
        </Stack>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: `${tokens.radius.md}px` }}>
            {errorMsg}
          </Alert>
        )}

        <Stack spacing={2.5}>
          <TextField
            label="Interview Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            size="small"
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Candidate Name"
                fullWidth
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Job Position"
                fullWidth
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                size="small"
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Start Time"
                type="datetime-local"
                fullWidth
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="End Time"
                type="datetime-local"
                fullWidth
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Location Type"
                select
                fullWidth
                value={locationType}
                onChange={(e) => setLocationType(e.target.value as any)}
                size="small"
              >
                <MenuItem value="virtual">Virtual Video Conference</MenuItem>
                <MenuItem value="in_person">On-site In Person</MenuItem>
                <MenuItem value="phone">Phone Screen</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Meeting URL or Room Location"
                fullWidth
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                size="small"
              />
            </Grid>
          </Grid>

          <TextField
            label="Internal Notes / Focus Areas"
            multiline
            rows={2}
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            size="small"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleScheduleSubmit}
          disabled={submitting}
          sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700, textTransform: 'none' }}
        >
          {submitting ? 'Scheduling...' : 'Confirm & Schedule'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ScheduleModal;

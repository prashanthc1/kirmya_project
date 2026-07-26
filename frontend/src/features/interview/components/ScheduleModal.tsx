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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EventIcon from '@mui/icons-material/Event';
import GroupIcon from '@mui/icons-material/Group';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import { CreateInterviewPayload } from '../types';

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

  // Multi-round configuration
  const [rounds, setRounds] = useState<Array<{
    round_name: string;
    round_type: string;
    scheduled_start: string;
    scheduled_end: string;
    instructions: string;
  }>>([
    {
      round_name: 'Round 1: Live Coding & Algorithm',
      round_type: 'technical',
      scheduled_start: tomorrow.toISOString().slice(0, 16),
      scheduled_end: new Date(tomorrow.getTime() + 45 * 60 * 1000).toISOString().slice(0, 16),
      instructions: 'Technical coding challenge on data structures.',
    },
    {
      round_name: 'Round 2: System Design & Architecture',
      round_type: 'system_design',
      scheduled_start: new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16),
      scheduled_end: new Date(tomorrow.getTime() + 105 * 60 * 1000).toISOString().slice(0, 16),
      instructions: 'Architecture assessment and API design.',
    },
  ]);

  // Panel members
  const [participants, setParticipants] = useState<Array<{
    user_id: string;
    user_name: string;
    user_email: string;
    role: string;
  }>>([
    {
      user_id: '22222222-2222-2222-2222-222222222222',
      user_name: 'Sarah Chen (Lead Tech)',
      user_email: 'sarah.chen@techcompany.com',
      role: 'lead_interviewer',
    },
    {
      user_id: '33333333-3333-3333-3333-333333333333',
      user_name: 'Michael Scott (Engineering Mgr)',
      user_email: 'michael.s@techcompany.com',
      role: 'interviewer',
    },
  ]);

  const [newPanelName, setNewPanelName] = useState('');
  const [newPanelRole, setNewPanelRole] = useState('interviewer');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddRound = () => {
    const roundCount = rounds.length + 1;
    setRounds([
      ...rounds,
      {
        round_name: `Round ${roundCount}: Behavioral & Culture Fit`,
        round_type: 'behavioral',
        scheduled_start: startDate,
        scheduled_end: endDate,
        instructions: 'Evaluate leadership principles and collaboration skills.',
      },
    ]);
  };

  const handleRemoveRound = (index: number) => {
    setRounds(rounds.filter((_, i) => i !== index));
  };

  const handleAddParticipant = () => {
    if (!newPanelName) return;
    setParticipants([
      ...participants,
      {
        user_id: `user-${Date.now()}`,
        user_name: newPanelName,
        user_email: `${newPanelName.toLowerCase().replace(/\s+/g, '.')}@techcompany.com`,
        role: newPanelRole,
      },
    ]);
    setNewPanelName('');
  };

  const handleRemoveParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setErrorMsg('');

      const payload: CreateInterviewPayload = {
        candidate_id: candidateId,
        title,
        job_id: undefined,
        scheduled_start: new Date(startDate).toISOString(),
        scheduled_end: new Date(endDate).toISOString(),
        location_type: locationType,
        meeting_link: meetingLink,
        notes: `Candidate: ${candidateName} | Job: ${jobTitle}. ${notes}`,
        rounds: rounds.map((r, index) => ({
          round_number: index + 1,
          round_name: r.round_name,
          round_type: r.round_type,
          scheduled_start: new Date(r.scheduled_start).toISOString(),
          scheduled_end: new Date(r.scheduled_end).toISOString(),
          meeting_link: meetingLink,
          instructions: r.instructions,
        })),
        participants: participants.map((p) => ({
          user_id: p.user_id,
          user_name: p.user_name,
          user_email: p.user_email,
          role: p.role,
        })),
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
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#1e293b', color: '#ffffff' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventIcon sx={{ color: '#38bdf8' }} />
          <Typography variant="h6" fontWeight="bold">Schedule New Interview</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#94a3b8' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3, bgcolor: '#0f172a', color: '#f8fafc' }}>
        {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <TextField
              label="Interview Title"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              variant="outlined"
              size="small"
              sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              select
              label="Location Format"
              fullWidth
              value={locationType}
              onChange={(e) => setLocationType(e.target.value as any)}
              size="small"
              sx={{ select: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
            >
              <MenuItem value="virtual">Virtual (Google Meet / Zoom)</MenuItem>
              <MenuItem value="in_person">In Person (Office)</MenuItem>
              <MenuItem value="phone">Phone Screening</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Candidate Name"
              fullWidth
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              size="small"
              sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Job Role / Position"
              fullWidth
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              size="small"
              sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Scheduled Start Time"
              type="datetime-local"
              fullWidth
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Scheduled End Time"
              type="datetime-local"
              fullWidth
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Meeting Link / Video Room URL"
              fullWidth
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: <VideoCallIcon sx={{ color: '#38bdf8', mr: 1 }} />,
              }}
              sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
            />
          </Grid>

          {/* Section: Interview Rounds */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8' }}>
                Interview Rounds ({rounds.length})
              </Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddRound}
                sx={{ color: '#38bdf8', borderColor: '#38bdf8' }}
                variant="outlined"
              >
                Add Round
              </Button>
            </Box>
            <Divider sx={{ borderColor: '#334155', mb: 2 }} />

            {rounds.map((round, idx) => (
              <Paper key={idx} sx={{ p: 2, mb: 1.5, bgcolor: '#1e293b', border: '1px solid #334155' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#e2e8f0' }}>
                    Round #{idx + 1}
                  </Typography>
                  {rounds.length > 1 && (
                    <IconButton size="small" onClick={() => handleRemoveRound(idx)} sx={{ color: '#f43f5e' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Grid container spacing={1.5}>
                  <Grid item xs={12} sm={7}>
                    <TextField
                      label="Round Title"
                      fullWidth
                      size="small"
                      value={round.round_name}
                      onChange={(e) => {
                        const updated = [...rounds];
                        updated[idx].round_name = e.target.value;
                        setRounds(updated);
                      }}
                      sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <TextField
                      select
                      label="Round Type"
                      fullWidth
                      size="small"
                      value={round.round_type}
                      onChange={(e) => {
                        const updated = [...rounds];
                        updated[idx].round_type = e.target.value;
                        setRounds(updated);
                      }}
                      sx={{ select: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                    >
                      <MenuItem value="screening">Screening</MenuItem>
                      <MenuItem value="technical">Technical Coding</MenuItem>
                      <MenuItem value="system_design">System Design</MenuItem>
                      <MenuItem value="behavioral">Behavioral / HR</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Instructions / Agenda"
                      fullWidth
                      size="small"
                      value={round.instructions}
                      onChange={(e) => {
                        const updated = [...rounds];
                        updated[idx].instructions = e.target.value;
                        setRounds(updated);
                      }}
                      sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Grid>

          {/* Section: Panel Members */}
          <Grid item xs={12} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8', mb: 1 }}>
              Interview Panel Members ({participants.length})
            </Typography>
            <Divider sx={{ borderColor: '#334155', mb: 2 }} />

            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                placeholder="Interviewer Name"
                size="small"
                value={newPanelName}
                onChange={(e) => setNewPanelName(e.target.value)}
                sx={{ flexGrow: 1, input: { color: '#fff' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
              />
              <TextField
                select
                size="small"
                value={newPanelRole}
                onChange={(e) => setNewPanelRole(e.target.value)}
                sx={{ width: 180, select: { color: '#fff' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
              >
                <MenuItem value="lead_interviewer">Lead Interviewer</MenuItem>
                <MenuItem value="interviewer">Interviewer</MenuItem>
                <MenuItem value="observer">Observer</MenuItem>
              </TextField>
              <Button variant="contained" onClick={handleAddParticipant} startIcon={<AddIcon />} sx={{ bgcolor: '#38bdf8', '&:hover': { bgcolor: '#0284c7' } }}>
                Add
              </Button>
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {participants.map((p, idx) => (
                <Chip
                  key={idx}
                  icon={<GroupIcon sx={{ color: '#38bdf8 !important' }} />}
                  label={`${p.user_name} (${p.role.replace('_', ' ')})`}
                  onDelete={() => handleRemoveParticipant(idx)}
                  sx={{ bgcolor: '#1e293b', color: '#e2e8f0', border: '1px solid #334155' }}
                />
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} sx={{ mt: 1 }}>
            <TextField
              label="Preparation Notes for Interviewers"
              multiline
              rows={2}
              fullWidth
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{ textarea: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#1e293b' }}>
        <Button onClick={onClose} sx={{ color: '#94a3b8' }}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', '&:hover': { bgcolor: '#0284c7' } }}
        >
          {submitting ? 'Scheduling...' : 'Schedule Interview'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default ScheduleModal;

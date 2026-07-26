import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Chip,
  Alert,
  Card,
  CardContent,
  IconButton,
  Divider,
} from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { CandidateAvailability, SetAvailabilityPayload } from '../types';

interface AvailabilityManagerProps {
  candidateId: string;
  availabilityList: CandidateAvailability[];
  onSaveAvailability: (payload: SetAvailabilityPayload) => Promise<void>;
  onScheduleForSlot: (slot: CandidateAvailability) => void;
}

export const AvailabilityManager: React.FC<AvailabilityManagerProps> = ({
  candidateId,
  availabilityList,
  onSaveAvailability,
  onScheduleForSlot,
}) => {
  const now = new Date();
  const defaultStart = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  defaultStart.setHours(10, 0, 0, 0);
  const defaultEnd = new Date(defaultStart.getTime() + 2 * 60 * 60 * 1000);

  const [startTime, setStartTime] = useState(defaultStart.toISOString().slice(0, 16));
  const [endTime, setEndTime] = useState(defaultEnd.toISOString().slice(0, 16));
  const [notes, setNotes] = useState('Available for technical or system design interviews');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const handleAddSlot = async () => {
    try {
      setSubmitting(true);
      setMsg('');
      await onSaveAvailability({
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        status: 'available',
        notes,
      });
      setMsg('Availability slot added successfully!');
    } catch (err: any) {
      setMsg(err?.response?.data?.error || 'Failed to add availability slot');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header Banner */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: '#1e293b', border: '1px solid #334155' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <EventAvailableIcon sx={{ color: '#38bdf8', fontSize: 28 }} />
          <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc' }}>
            Candidate Availability Manager
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#94a3b8' }}>
          Define open time slots when the candidate is available for interview rounds to streamline scheduling and eliminate back-and-forth emails.
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* Slot Addition Form */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #334155' }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8', mb: 2 }}>
              Add New Available Slot
            </Typography>

            {msg && <Alert severity={msg.includes('successfully') ? 'success' : 'error'} sx={{ mb: 2 }}>{msg}</Alert>}

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Slot Start Time"
                  type="datetime-local"
                  fullWidth
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Slot End Time"
                  type="datetime-local"
                  fullWidth
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Candidate Notes / Preference"
                  fullWidth
                  multiline
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  size="small"
                  sx={{ textarea: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleAddSlot}
                  disabled={submitting}
                  startIcon={<AddIcon />}
                  sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', py: 1, '&:hover': { bgcolor: '#0284c7' } }}
                >
                  {submitting ? 'Saving...' : 'Save Availability Slot'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Existing Slots List */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #334155', minHeight: 320 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8', mb: 2 }}>
              Active Availability Slots ({availabilityList.length})
            </Typography>
            <Divider sx={{ borderColor: '#334155', mb: 2 }} />

            {availabilityList.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 5, color: '#64748b' }}>
                <AccessTimeIcon sx={{ fontSize: 48, mb: 1, color: '#334155' }} />
                <Typography variant="body1">No availability slots registered yet.</Typography>
                <Typography variant="caption">Use the form on the left to add candidate open windows.</Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {availabilityList.map((slot) => {
                  const startStr = new Date(slot.start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
                  const endStr = new Date(slot.end_time).toLocaleTimeString([], { timeStyle: 'short' });
                  return (
                    <Grid item xs={12} key={slot.id}>
                      <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 1.5 }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <AccessTimeIcon sx={{ color: '#38bdf8', fontSize: 20 }} />
                              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#f8fafc' }}>
                                {startStr} - {endStr}
                              </Typography>
                            </Box>
                            <Chip
                              label={slot.status.toUpperCase()}
                              size="small"
                              sx={{
                                bgcolor: slot.status === 'available' ? '#22c55e' : '#eab308',
                                color: '#fff',
                                fontWeight: 'bold',
                                fontSize: '0.7rem',
                              }}
                            />
                          </Box>
                          {slot.notes && (
                            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 1.5 }}>
                              {slot.notes}
                            </Typography>
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onScheduleForSlot(slot)}
                            sx={{ color: '#38bdf8', borderColor: '#38bdf8', fontWeight: 'bold' }}
                          >
                            Schedule Interview In This Slot
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
export default AvailabilityManager;

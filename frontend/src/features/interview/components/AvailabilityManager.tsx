'use client';

import React, { useState } from 'react';
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
  Stack,
} from '@mui/material';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { CandidateAvailability, SetAvailabilityPayload } from '../types';
import { tokens } from '../../../theme/tokens';

interface AvailabilityManagerProps {
  candidateId: string;
  availabilityList: CandidateAvailability[];
  onSaveAvailability: (payload: SetAvailabilityPayload) => Promise<void>;
  onScheduleForSlot?: (slot: CandidateAvailability) => void;
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
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          mb: 3,
          borderRadius: `${tokens.radius.lg}px`,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <EventAvailableIcon color="primary" sx={{ fontSize: 28 }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Candidate Availability Manager
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Define open time slots when you are available for interview rounds to streamline scheduling and eliminate back-and-forth emails.
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* Slot Addition Form */}
        <Grid item xs={12} md={5}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: `${tokens.radius.lg}px`,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
              Add New Available Slot
            </Typography>

            {msg && (
              <Alert
                severity={msg.includes('successfully') ? 'success' : 'error'}
                sx={{ mb: 2, borderRadius: `${tokens.radius.md}px` }}
              >
                {msg}
              </Alert>
            )}

            <Stack spacing={2}>
              <TextField
                label="Slot Start Time"
                type="datetime-local"
                fullWidth
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />

              <TextField
                label="Slot End Time"
                type="datetime-local"
                fullWidth
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />

              <TextField
                label="Notes / Timezone Context"
                fullWidth
                multiline
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                size="small"
              />

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddSlot}
                disabled={submitting}
                sx={{
                  borderRadius: `${tokens.radius.sm}px`,
                  fontWeight: 700,
                  textTransform: 'none',
                  py: 1,
                }}
              >
                {submitting ? 'Saving Slot...' : 'Save Availability Slot'}
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Existing Slots List */}
        <Grid item xs={12} md={7}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: `${tokens.radius.lg}px`,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
              Configured Availability Slots ({availabilityList.length})
            </Typography>

            {availabilityList.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                No active availability slots saved. Add one using the form on the left.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {availabilityList.map((slot, idx) => {
                  const start = new Date(slot.start_time).toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const end = new Date(slot.end_time).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <Card
                      key={slot.id || idx}
                      variant="outlined"
                      sx={{
                        borderRadius: `${tokens.radius.md}px`,
                        transition: 'border-color 0.2s ease',
                        '&:hover': { borderColor: 'primary.main' },
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <AccessTimeIcon color="primary" fontSize="small" />
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                {start} – {end}
                              </Typography>
                              {slot.notes && (
                                <Typography variant="caption" color="text.secondary">
                                  {slot.notes}
                                </Typography>
                              )}
                            </Box>
                          </Stack>

                          <Chip
                            label={slot.status || 'available'}
                            size="small"
                            color={slot.status === 'booked' ? 'secondary' : 'success'}
                            sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'capitalize' }}
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AvailabilityManager;

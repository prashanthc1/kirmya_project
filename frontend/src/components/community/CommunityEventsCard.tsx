import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  IconButton,
  Tooltip,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import AddIcon from '@mui/icons-material/Add';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VideoCameraFrontIcon from '@mui/icons-material/VideoCameraFront';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CancelIcon from '@mui/icons-material/Cancel';
import { CommunityEvent } from '../../features/community/types';
import { communityApi } from '../../features/community/services/communityApi';

interface CommunityEventsCardProps {
  communityId: string;
  events: CommunityEvent[];
  userRole?: string | null;
  onEventUpdated?: () => void;
}

export const CommunityEventsCard: React.FC<CommunityEventsCardProps> = ({
  communityId,
  events: initialEvents,
  userRole,
  onEventUpdated,
}) => {
  const [events, setEvents] = useState<CommunityEvent[]>(initialEvents);
  const [openModal, setOpenModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [location, setLocation] = useState('Online Zoom');
  const [isOnline, setIsOnline] = useState(true);
  const [meetingUrl, setMeetingUrl] = useState('');

  const handleRsvp = async (eventId: string, status: 'attending' | 'declined' | 'maybe') => {
    const res = await communityApi.rsvpEvent(communityId, eventId, status);
    setEvents(
      events.map((e) =>
        e.id === eventId ? { ...e, rsvpCount: res.rsvpCount ?? (e.rsvpCount + (status === 'attending' ? 1 : 0)), userRsvp: status } : e
      )
    );
    if (onEventUpdated) onEventUpdated();
  };

  const handleCreateEventSubmit = async () => {
    if (!title) return;
    const created = await communityApi.createEvent(communityId, {
      title,
      description,
      startDate: startDate || new Date().toISOString(),
      location,
      isOnline,
      meetingUrl,
    });
    setEvents([created, ...events]);
    setOpenModal(false);
    setTitle('');
    setDescription('');
    if (onEventUpdated) onEventUpdated();
  };

  return (
    <Paper
      data-testid="community-events-card"
      elevation={0}
      sx={{
        p: 3,
        borderRadius: '20px',
        background: (theme) =>
          theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(30, 41, 59, 0.85)',
        backdropFilter: 'blur(16px)',
        border: (theme) =>
          theme.palette.mode === 'light'
            ? '1px solid rgba(99, 102, 241, 0.15)'
            : '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventIcon color="primary" /> Upcoming Events & Webinars ({events.length})
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
          sx={{ borderRadius: '10px', fontWeight: 700 }}
        >
          Host Event
        </Button>
      </Box>

      {events.length === 0 ? (
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ py: 3 }}>
          No scheduled events. Host a tech talk, Q&A, or workshop!
        </Typography>
      ) : (
        <Stack spacing={2}>
          {events.map((evt) => (
            <Card
              key={evt.id}
              data-testid={`event-card-${evt.id}`}
              sx={{
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'divider',
                p: 1,
              }}
            >
              <CardContent sx={{ pb: '16px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {evt.title}
                  </Typography>
                  <Chip
                    icon={evt.isOnline ? <VideoCameraFrontIcon sx={{ fontSize: 14 }} /> : <LocationOnIcon sx={{ fontSize: 14 }} />}
                    label={evt.isOnline ? 'Online' : 'In-Person'}
                    size="small"
                    color={evt.isOnline ? 'info' : 'default'}
                    sx={{ fontWeight: 700 }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {evt.description}
                </Typography>

                <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 2 }}>
                  <Typography variant="caption" color="primary.main" fontWeight={700}>
                    📅 {new Date(evt.startDate).toLocaleString()}
                  </Typography>
                  {evt.location && (
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      📍 {evt.location}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    👥 {evt.rsvpCount} Attending
                  </Typography>
                </Stack>

                {/* RSVP Actions */}
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mr: 1 }}>
                    Your RSVP:
                  </Typography>
                  <Button
                    size="small"
                    variant={evt.userRsvp === 'attending' ? 'contained' : 'outlined'}
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleRsvp(evt.id, 'attending')}
                    sx={{ borderRadius: '8px', fontWeight: 700 }}
                  >
                    Going
                  </Button>
                  <Button
                    size="small"
                    variant={evt.userRsvp === 'maybe' ? 'contained' : 'outlined'}
                    color="warning"
                    startIcon={<HelpOutlineIcon />}
                    onClick={() => handleRsvp(evt.id, 'maybe')}
                    sx={{ borderRadius: '8px', fontWeight: 700 }}
                  >
                    Maybe
                  </Button>
                  <Button
                    size="small"
                    variant={evt.userRsvp === 'declined' ? 'contained' : 'outlined'}
                    color="inherit"
                    startIcon={<CancelIcon />}
                    onClick={() => handleRsvp(evt.id, 'declined')}
                    sx={{ borderRadius: '8px', fontWeight: 700 }}
                  >
                    Decline
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Host Event Dialog */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Schedule Community Event</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Event Title"
              required
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TextField
              label="Description / Agenda"
              multiline
              rows={3}
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <TextField
              label="Start Date & Time"
              type="datetime-local"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <FormControlLabel
              control={<Switch checked={isOnline} onChange={(e) => setIsOnline(e.target.checked)} />}
              label="Online Virtual Event"
            />
            <TextField
              label="Location / Platform"
              fullWidth
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            {isOnline && (
              <TextField
                label="Meeting / Webinar Link"
                fullWidth
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
                placeholder="https://zoom.us/j/..."
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button onClick={handleCreateEventSubmit} variant="contained" disabled={!title}>
            Schedule Event
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

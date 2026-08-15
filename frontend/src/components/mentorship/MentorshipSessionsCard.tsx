import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Stack,
  Tooltip,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import VideoCameraFrontIcon from '@mui/icons-material/VideoCameraFront';
import ChatIcon from '@mui/icons-material/Chat';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import MarkUnreadChatAltIcon from '@mui/icons-material/MarkUnreadChatAlt';
import AddIcon from '@mui/icons-material/Add';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { MentorshipSession, SessionFormat } from '../../features/mentorship/types';

interface MentorshipSessionsCardProps {
  sessions: MentorshipSession[];
  onScheduleSession?: (sessionData: Partial<MentorshipSession>) => Promise<void>;
  onUpdateSessionStatus?: (sessionId: string, status: 'scheduled' | 'completed' | 'cancelled') => Promise<void>;
}

export const MentorshipSessionsCard: React.FC<MentorshipSessionsCardProps> = ({
  sessions,
  onScheduleSession,
  onUpdateSessionStatus,
}) => {
  const [openModal, setOpenModal] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState(45);
  const [format, setFormat] = useState<SessionFormat>('video');

  const handleOpenSchedule = () => {
    setTitle('');
    setDesc('');
    // Default to tomorrow 4 PM
    const tomorrow = new Date(Date.now() + 86400000);
    tomorrow.setHours(16, 0, 0, 0);
    setScheduledAt(tomorrow.toISOString().slice(0, 16));
    setDuration(45);
    setFormat('video');
    setOpenModal(true);
  };

  const handleScheduleSubmit = async () => {
    if (!title.trim() || !scheduledAt) return;
    await onScheduleSession?.({
      title: title.trim(),
      description: desc.trim(),
      scheduled_at: new Date(scheduledAt).toISOString(),
      duration_minutes: Number(duration),
      format,
      status: 'scheduled',
      meeting_url: format === 'video' ? `https://meet.kirmya.com/session-${Date.now()}` : undefined,
    });
    setOpenModal(false);
  };

  const getFormatIcon = (fmt: SessionFormat) => {
    switch (fmt) {
      case 'video':
        return <VideoCameraFrontIcon fontSize="small" color="primary" />;
      case 'chat':
        return <ChatIcon fontSize="small" color="info" />;
      case 'audio':
        return <GraphicEqIcon fontSize="small" color="secondary" />;
      case 'async':
      default:
        return <MarkUnreadChatAltIcon fontSize="small" color="warning" />;
    }
  };

  return (
    <Card
      sx={{
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'rgba(255, 255, 255, 0.8)'
            : 'rgba(30, 41, 59, 0.8)',
        backdropFilter: 'blur(16px)',
        border: (theme) =>
          theme.palette.mode === 'light'
            ? '1px solid rgba(255, 255, 255, 0.6)'
            : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '20px',
        boxShadow: (theme) =>
          theme.palette.mode === 'light'
            ? '0 8px 32px 0 rgba(31, 38, 135, 0.07)'
            : '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header & Button */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <EventIcon color="primary" sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Mentorship Sessions
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Upcoming & past 1-on-1 meetings
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={handleOpenSchedule}
            sx={{
              borderRadius: '10px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            }}
          >
            Schedule
          </Button>
        </Box>

        {/* Sessions List */}
        <Stack spacing={2}>
          {sessions.length === 0 ? (
            <Box
              sx={{
                p: 3,
                textAlign: 'center',
                borderRadius: '12px',
                border: '1px dashed rgba(140,140,140,0.3)',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No sessions scheduled yet. Click "Schedule" to book a session.
              </Typography>
            </Box>
          ) : (
            sessions.map((session) => {
              const dateStr = new Date(session.scheduled_at).toLocaleString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              });

              const isUpcoming = session.status === 'scheduled';

              return (
                <Box
                  key={session.id}
                  sx={{
                    p: 2,
                    borderRadius: '14px',
                    bgcolor: (theme) =>
                      theme.palette.mode === 'light'
                        ? 'rgba(255, 255, 255, 0.6)'
                        : 'rgba(15, 23, 42, 0.4)',
                    border: (theme) =>
                      theme.palette.mode === 'light'
                        ? '1px solid rgba(0, 0, 0, 0.08)'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getFormatIcon(session.format)}
                      <Typography variant="subtitle2" fontWeight={700}>
                        {session.title}
                      </Typography>
                    </Box>
                    <Chip
                      label={session.status}
                      size="small"
                      color={
                        session.status === 'scheduled'
                          ? 'primary'
                          : session.status === 'completed'
                          ? 'success'
                          : 'default'
                      }
                      variant="filled"
                      sx={{ fontSize: '0.68rem', textTransform: 'capitalize', fontWeight: 600 }}
                    />
                  </Box>

                  {session.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      {session.description}
                    </Typography>
                  )}

                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justify: 'space-between',
                      gap: 1,
                      pt: 1,
                      borderTop: '1px solid rgba(140,140,140,0.12)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTimeIcon fontSize="small" color="action" />
                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                          {dateStr} ({session.duration_minutes} min)
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {session.meeting_url && isUpcoming && (
                        <Button
                          href={session.meeting_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="outlined"
                          size="small"
                          endIcon={<OpenInNewIcon fontSize="small" />}
                          sx={{ borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          Join Meeting
                        </Button>
                      )}
                      {isUpcoming && (
                        <Button
                          size="small"
                          color="success"
                          variant="text"
                          onClick={() => onUpdateSessionStatus?.(session.id, 'completed')}
                          sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          Mark Completed
                        </Button>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })
          )}
        </Stack>
      </CardContent>

      {/* Schedule Session Modal */}
      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '18px', p: 1 },
        }}
      >
        <DialogTitle fontWeight={700}>Schedule Mentorship Session</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              label="Session Title"
              fullWidth
              size="small"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Architecture Deep Dive"
              required
            />
            <TextField
              label="Agenda & Focus Notes"
              fullWidth
              multiline
              rows={2}
              size="small"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <TextField
              label="Date & Time"
              type="datetime-local"
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
            />
            <TextField
              select
              label="Duration"
              fullWidth
              size="small"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            >
              <MenuItem value={30}>30 Minutes</MenuItem>
              <MenuItem value={45}>45 Minutes</MenuItem>
              <MenuItem value={60}>60 Minutes</MenuItem>
            </TextField>
            <TextField
              select
              label="Format"
              fullWidth
              size="small"
              value={format}
              onChange={(e) => setFormat(e.target.value as SessionFormat)}
            >
              <MenuItem value="video">Video Call (Google Meet / Zoom)</MenuItem>
              <MenuItem value="chat">Live Text Chat</MenuItem>
              <MenuItem value="audio">Audio Call</MenuItem>
              <MenuItem value="async">Async Code/Doc Review</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenModal(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleScheduleSubmit}
            variant="contained"
            disabled={!title.trim() || !scheduledAt}
          >
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default MentorshipSessionsCard;

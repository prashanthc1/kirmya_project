'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  Chip,
  LinearProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Avatar,
  Select,
  MenuItem,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import VideoCameraFrontIcon from '@mui/icons-material/VideoCameraFront';
import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import GroupsIcon from '@mui/icons-material/Groups';

import { eventApi } from '../../features/event/api';
import { Event, EventCategory } from '../../features/event/types';

export default function EventsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [events, setEvents] = useState<Event[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);

  // Host Event Modal
  const [hostModalOpen, setHostModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<EventCategory>('hiring_event');
  const [eventDesc, setEventDesc] = useState('');
  const [eventHostName, setEventHostName] = useState('Sarah Jenkins');
  const [eventCompany, setEventCompany] = useState('TechCorp Global');

  // Live Room Modal
  const [activeLiveEvent, setActiveLiveEvent] = useState<Event | null>(null);
  const [liveModalOpen, setLiveModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resEvents, resMy] = await Promise.allSettled([
        eventApi.getEvents(selectedCategory),
        eventApi.getUserRegistrations(),
      ]);

      if (resEvents.status === 'fulfilled') {
        setEvents(resEvents.value?.data || mockEvents);
      } else {
        setEvents(mockEvents);
      }

      if (resMy.status === 'fulfilled') {
        setMyRegistrations(resMy.value?.data || []);
      }
    } catch (err) {
      console.error(err);
      setEvents(mockEvents);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  const handleRegister = async (event: Event) => {
    try {
      setLoading(true);
      if (event.is_registered) {
        await eventApi.cancelRegistration(event.id);
      } else {
        await eventApi.registerAttendee(event.id);
      }
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      const endTime = new Date(now.getTime() + 26 * 60 * 60 * 1000).toISOString();

      await eventApi.createEvent({
        title: eventTitle || 'New Professional Networking Event',
        event_type: eventType,
        description: eventDesc || 'Join us for a career growth webinar and hiring session.',
        start_time: startTime,
        end_time: endTime,
        max_attendees: 300,
        location_type: 'virtual',
        host_name: eventHostName,
        company_name: eventCompany,
      });

      setHostModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchLiveRoom = (ev: Event) => {
    setActiveLiveEvent(ev);
    setLiveModalOpen(true);
  };

  const mockEvents: Event[] = [
    {
      id: 'e1111111-1111-1111-1111-111111111111',
      host_id: 'h1',
      title: 'Virtual Tech Hiring Fair & Speed Recruiter Match',
      event_type: 'hiring_event',
      description: 'Connect live with hiring managers from 15+ tech scaleups. Speed interviewing sessions and ATS resume reviews.',
      start_time: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      end_time: new Date(Date.now() + 27 * 3600 * 1000).toISOString(),
      max_attendees: 500,
      current_attendees: 142,
      location_type: 'virtual',
      live_stream_url: 'https://live.kirmya.dev/rooms/hiring-fair-2026',
      status: 'upcoming',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      host: {
        id: 'h1',
        user_id: 'u1',
        host_name: 'Sarah Jenkins',
        company_name: 'TechCorp & Kirmya Careers',
        title: 'VP of Engineering',
        verified_host: true,
        created_at: new Date().toISOString(),
      },
      is_registered: true,
      live_stream: {
        stream_url: 'https://live.kirmya.dev/rooms/hiring-fair-2026',
        provider: 'kirmya-webrtc-v1',
        room_id: 'kirmya-room-hiring',
        access_token: 'token-998811',
      },
    },
    {
      id: 'e2222222-2222-2222-2222-222222222222',
      host_id: 'h2',
      title: 'Mastering System Design & Distributed Go Architecture',
      event_type: 'webinar',
      description: 'Technical webinar covering microservice isolation, rate limiting algorithms, and PostgreSQL P99 query optimization.',
      start_time: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      end_time: new Date(Date.now() + 50 * 3600 * 1000).toISOString(),
      max_attendees: 300,
      current_attendees: 98,
      location_type: 'virtual',
      live_stream_url: 'https://live.kirmya.dev/rooms/sys-design-webinar',
      status: 'upcoming',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      host: {
        id: 'h2',
        user_id: 'u2',
        host_name: 'David Chen',
        company_name: 'Stripe Global',
        title: 'Principal Architect',
        verified_host: true,
        created_at: new Date().toISOString(),
      },
      is_registered: false,
      live_stream: {
        stream_url: 'https://live.kirmya.dev/rooms/sys-design-webinar',
        provider: 'kirmya-webrtc-v1',
        room_id: 'kirmya-room-webinar',
        access_token: 'token-774422',
      },
    },
  ];

  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100vh', color: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Title Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(90deg, #38bdf8 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Professional Networking Events & Webinars Studio
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Discover career fairs, technical webinars, virtual hiring hackathons, and community meetups with live streaming integration.
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={() => setHostModalOpen(true)}
            startIcon={<AddIcon />}
            sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', py: 1, '&:hover': { bgcolor: '#0284c7' } }}
          >
            Host an Event
          </Button>
        </Box>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />}

        {/* Category Filter Bar */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: '#94a3b8', mr: 1, fontWeight: 'bold' }}>Filter Events:</Typography>
          <Chip
            label="All Categories"
            onClick={() => setSelectedCategory('')}
            sx={{ bgcolor: selectedCategory === '' ? '#38bdf8' : '#0f172a', color: selectedCategory === '' ? '#0f172a' : '#94a3b8', fontWeight: 'bold' }}
          />
          <Chip
            icon={<WorkIcon fontSize="small" sx={{ color: 'inherit !important' }} />}
            label="Hiring Fairs"
            onClick={() => setSelectedCategory('hiring_event')}
            sx={{ bgcolor: selectedCategory === 'hiring_event' ? '#38bdf8' : '#0f172a', color: selectedCategory === 'hiring_event' ? '#0f172a' : '#94a3b8', fontWeight: 'bold' }}
          />
          <Chip
            icon={<SchoolIcon fontSize="small" sx={{ color: 'inherit !important' }} />}
            label="Webinars"
            onClick={() => setSelectedCategory('webinar')}
            sx={{ bgcolor: selectedCategory === 'webinar' ? '#38bdf8' : '#0f172a', color: selectedCategory === 'webinar' ? '#0f172a' : '#94a3b8', fontWeight: 'bold' }}
          />
          <Chip
            icon={<EventIcon fontSize="small" sx={{ color: 'inherit !important' }} />}
            label="Career Workshops"
            onClick={() => setSelectedCategory('career_event')}
            sx={{ bgcolor: selectedCategory === 'career_event' ? '#38bdf8' : '#0f172a', color: selectedCategory === 'career_event' ? '#0f172a' : '#94a3b8', fontWeight: 'bold' }}
          />
          <Chip
            icon={<GroupsIcon fontSize="small" sx={{ color: 'inherit !important' }} />}
            label="Community Meetups"
            onClick={() => setSelectedCategory('community_meetup')}
            sx={{ bgcolor: selectedCategory === 'community_meetup' ? '#38bdf8' : '#0f172a', color: selectedCategory === 'community_meetup' ? '#0f172a' : '#94a3b8', fontWeight: 'bold' }}
          />
        </Paper>

        {/* Events Catalog Grid */}
        <Grid container spacing={3}>
          {events.map((ev) => (
            <Grid item xs={12} md={6} key={ev.id}>
              <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Chip
                      label={ev.event_type.replace('_', ' ').toUpperCase()}
                      size="small"
                      sx={{ bgcolor: '#0f172a', color: '#38bdf8', border: '1px solid #334155', fontWeight: 'bold' }}
                    />
                    <Chip
                      icon={<PeopleIcon sx={{ color: '#10b981 !important' }} />}
                      label={`${ev.current_attendees}/${ev.max_attendees} Registered`}
                      size="small"
                      sx={{ bgcolor: '#0f172a', color: '#10b981', fontWeight: 'bold' }}
                    />
                  </Box>

                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 1 }}>
                    {ev.title}
                  </Typography>

                  <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2, flexGrow: 1 }}>
                    {ev.description}
                  </Typography>

                  {/* Host Info */}
                  {ev.host && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, bgcolor: '#0f172a', p: 1.5, borderRadius: 1.5 }}>
                      <Avatar sx={{ bgcolor: '#a855f7', width: 36, height: 36, fontWeight: 'bold' }}>
                        {ev.host.host_name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#f8fafc' }}>
                          Hosted by {ev.host.host_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#38bdf8' }}>
                          {ev.host.title} • {ev.host.company_name}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748b', mb: 2 }}>
                    <AccessTimeIcon fontSize="small" />
                    <Typography variant="caption">
                      {new Date(ev.start_time).toLocaleString()}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant={ev.is_registered ? 'outlined' : 'contained'}
                      fullWidth
                      onClick={() => handleRegister(ev)}
                      startIcon={ev.is_registered ? <CheckCircleIcon /> : <EventIcon />}
                      sx={{
                        bgcolor: ev.is_registered ? 'transparent' : '#38bdf8',
                        color: ev.is_registered ? '#22c55e' : '#0f172a',
                        borderColor: ev.is_registered ? '#22c55e' : 'transparent',
                        fontWeight: 'bold',
                        py: 1,
                      }}
                    >
                      {ev.is_registered ? 'RSVP Registered' : '1-Click RSVP'}
                    </Button>

                    <Button
                      variant="contained"
                      onClick={() => handleLaunchLiveRoom(ev)}
                      startIcon={<VideoCameraFrontIcon />}
                      sx={{ bgcolor: '#a855f7', color: '#fff', fontWeight: 'bold', minWidth: 140 }}
                    >
                      Launch Live
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Host New Event Modal */}
        <Dialog open={hostModalOpen} onClose={() => setHostModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', fontWeight: 'bold' }}>
            Organize Professional Networking Event
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: '#0f172a', color: '#f8fafc', p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Event Title"
                  fullWidth
                  size="small"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>Event Category:</Typography>
                <Select
                  value={eventType}
                  size="small"
                  fullWidth
                  onChange={(e) => setEventType(e.target.value as EventCategory)}
                  sx={{ color: '#fff', bgcolor: '#1e293b', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
                >
                  <MenuItem value="hiring_event">Virtual Hiring Fair</MenuItem>
                  <MenuItem value="webinar">Technical Webinar</MenuItem>
                  <MenuItem value="career_event">Career Workshop</MenuItem>
                  <MenuItem value="community_meetup">Community Meetup</MenuItem>
                </Select>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Host Name"
                  fullWidth
                  size="small"
                  value={eventHostName}
                  onChange={(e) => setEventHostName(e.target.value)}
                  sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Host Company"
                  fullWidth
                  size="small"
                  value={eventCompany}
                  onChange={(e) => setEventCompany(e.target.value)}
                  sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Description & Agenda"
                  multiline
                  rows={3}
                  fullWidth
                  size="small"
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  sx={{ textarea: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: '#1e293b' }}>
            <Button onClick={() => setHostModalOpen(false)} sx={{ color: '#94a3b8' }}>Cancel</Button>
            <Button onClick={handleCreateEvent} variant="contained" sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}>
              Publish Event & Generate Stream Room
            </Button>
          </DialogActions>
        </Dialog>

        {/* Live Stream Room Modal */}
        <Dialog open={liveModalOpen} onClose={() => setLiveModalOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PlayCircleIcon sx={{ color: '#a855f7' }} />
              <Typography variant="h6" fontWeight="bold">{activeLiveEvent?.title}</Typography>
            </Box>
            <IconButton onClick={() => setLiveModalOpen(false)} sx={{ color: '#94a3b8' }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: '#0f172a', color: '#f8fafc', p: 3, textAlign: 'center' }}>
            <Box sx={{ bgcolor: '#000', borderRadius: 2.5, py: 8, px: 3, mb: 3, border: '2px solid #a855f7' }}>
              <VideoCameraFrontIcon sx={{ fontSize: 64, color: '#a855f7', mb: 2 }} />
              <Typography variant="h5" fontWeight="bold" sx={{ color: '#fff', mb: 1 }}>
                Live Virtual Video Room Ready
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
                Provider: <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{activeLiveEvent?.live_stream?.provider || 'Kirmya WebRTC Studio'}</span> • Room ID: <span style={{ fontFamily: 'monospace', color: '#a855f7' }}>{activeLiveEvent?.live_stream?.room_id}</span>
              </Typography>
              <Button
                variant="contained"
                href={activeLiveEvent?.live_stream?.stream_url || '#'}
                target="_blank"
                sx={{ bgcolor: '#a855f7', color: '#fff', fontWeight: 'bold', px: 4, py: 1.2 }}
              >
                Join Video Broadcast Stream
              </Button>
            </Box>
          </DialogContent>
        </Dialog>
      </Container>
    </Box>
  );
}

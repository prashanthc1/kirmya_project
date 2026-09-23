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
        setEvents(resEvents.value?.data ?? []);
      } else {
        setEvents([]);
      }

      if (resMy.status === 'fulfilled') {
        setMyRegistrations(resMy.value?.data || []);
      }
    } catch (err) {
      console.error(err);
      setEvents([]);
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


  return (
    <Box sx={{ bgcolor: "background.default", minHeight: '100dvh', color: "text.primary", py: 4 }}>
      <Container maxWidth="xl">
        {/* Title Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ bgcolor: "transparent", WebkitBackgroundClip: 'text', WebkitTextFillColor: "currentColor" }}>
              Professional Networking Events & Webinars Studio
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Discover career fairs, technical webinars, virtual hiring hackathons, and community meetups with live streaming integration.
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={() => setHostModalOpen(true)}
            startIcon={<AddIcon />}
            sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 'bold', py: 1, '&:hover': { bgcolor: "primary.main" } }}
          >
            Host an Event
          </Button>
        </Box>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: "background.paper", '& .MuiLinearProgress-bar': { bgcolor: "primary.main" } }} />}

        {/* Category Filter Bar */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: "background.paper", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: "text.secondary", mr: 1, fontWeight: 'bold' }}>Filter Events:</Typography>
          <Chip
            label="All Categories"
            onClick={() => setSelectedCategory('')}
            sx={{ bgcolor: selectedCategory === '' ? "primary.main" : "background.default", color: selectedCategory === '' ? "primary.contrastText" : "text.secondary", fontWeight: 'bold' }}
          />
          <Chip
            icon={<WorkIcon fontSize="small" sx={{ color: 'inherit !important' }} />}
            label="Hiring Fairs"
            onClick={() => setSelectedCategory('hiring_event')}
            sx={{ bgcolor: selectedCategory === 'hiring_event' ? "primary.main" : "background.default", color: selectedCategory === 'hiring_event' ? "primary.contrastText" : "text.secondary", fontWeight: 'bold' }}
          />
          <Chip
            icon={<SchoolIcon fontSize="small" sx={{ color: 'inherit !important' }} />}
            label="Webinars"
            onClick={() => setSelectedCategory('webinar')}
            sx={{ bgcolor: selectedCategory === 'webinar' ? "primary.main" : "background.default", color: selectedCategory === 'webinar' ? "primary.contrastText" : "text.secondary", fontWeight: 'bold' }}
          />
          <Chip
            icon={<EventIcon fontSize="small" sx={{ color: 'inherit !important' }} />}
            label="Career Workshops"
            onClick={() => setSelectedCategory('career_event')}
            sx={{ bgcolor: selectedCategory === 'career_event' ? "primary.main" : "background.default", color: selectedCategory === 'career_event' ? "primary.contrastText" : "text.secondary", fontWeight: 'bold' }}
          />
          <Chip
            icon={<GroupsIcon fontSize="small" sx={{ color: 'inherit !important' }} />}
            label="Community Meetups"
            onClick={() => setSelectedCategory('community_meetup')}
            sx={{ bgcolor: selectedCategory === 'community_meetup' ? "primary.main" : "background.default", color: selectedCategory === 'community_meetup' ? "primary.contrastText" : "text.secondary", fontWeight: 'bold' }}
          />
        </Paper>

        {/* Events Catalog Grid */}
        <Grid container spacing={3}>
          {events.map((ev) => (
            <Grid item xs={12} md={6} key={ev.id}>
              <Card sx={{ bgcolor: "background.paper", border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Chip
                      label={ev.event_type.replace('_', ' ').toUpperCase()}
                      size="small"
                      sx={{ bgcolor: "background.default", color: "primary.main", border: (theme) => `1px solid ${theme.palette.divider}`, fontWeight: 'bold' }}
                    />
                    <Chip
                      icon={<PeopleIcon sx={{ color: '#10b981 !important' }} />}
                      label={`${ev.current_attendees}/${ev.max_attendees} Registered`}
                      size="small"
                      sx={{ bgcolor: "background.default", color: '#10b981', fontWeight: 'bold' }}
                    />
                  </Box>

                  <Typography variant="h6" fontWeight="bold" sx={{ color: "text.primary", mb: 1 }}>
                    {ev.title}
                  </Typography>

                  <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, flexGrow: 1 }}>
                    {ev.description}
                  </Typography>

                  {/* Host Info */}
                  {ev.host && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, bgcolor: "background.default", p: 1.5, borderRadius: 1.5 }}>
                      <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36, fontWeight: 'bold' }}>
                        {ev.host.host_name.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: "text.primary" }}>
                          Hosted by {ev.host.host_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "primary.main" }}>
                          {ev.host.title} • {ev.host.company_name}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: "text.secondary", mb: 2 }}>
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
                        bgcolor: ev.is_registered ? 'transparent' : "primary.main",
                        color: ev.is_registered ? '#22c55e' : "primary.contrastText",
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
                      sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 'bold', minWidth: 140 }}
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
          <DialogTitle sx={{ bgcolor: "background.paper", color: "text.primary", fontWeight: 'bold' }}>
            Organize Professional Networking Event
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: "background.default", color: "text.primary", p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Event Title"
                  fullWidth
                  size="small"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  sx={{ input: { color: "text.primary" }, label: { color: "text.secondary" }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: "divider" } } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" sx={{ color: "text.secondary", display: 'block', mb: 0.5 }}>Event Category:</Typography>
                <Select
                  value={eventType}
                  size="small"
                  fullWidth
                  onChange={(e) => setEventType(e.target.value as EventCategory)}
                  sx={{ color: "text.primary", bgcolor: "background.paper", '& .MuiOutlinedInput-notchedOutline': { borderColor: "divider" } }}
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
                  sx={{ input: { color: "text.primary" }, label: { color: "text.secondary" }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: "divider" } } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Host Company"
                  fullWidth
                  size="small"
                  value={eventCompany}
                  onChange={(e) => setEventCompany(e.target.value)}
                  sx={{ input: { color: "text.primary" }, label: { color: "text.secondary" }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: "divider" } } }}
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
                  sx={{ textarea: { color: "text.primary" }, label: { color: "text.secondary" }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: "divider" } } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: "background.paper" }}>
            <Button onClick={() => setHostModalOpen(false)} sx={{ color: "text.secondary" }}>Cancel</Button>
            <Button onClick={handleCreateEvent} variant="contained" sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 'bold' }}>
              Publish Event & Generate Stream Room
            </Button>
          </DialogActions>
        </Dialog>

        {/* Live Stream Room Modal */}
        <Dialog open={liveModalOpen} onClose={() => setLiveModalOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ bgcolor: "background.paper", color: "text.primary", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PlayCircleIcon sx={{ color: "primary.main" }} />
              <Typography variant="h6" fontWeight="bold">{activeLiveEvent?.title}</Typography>
            </Box>
            <IconButton onClick={() => setLiveModalOpen(false)} sx={{ color: "text.secondary" }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: "background.default", color: "text.primary", p: 3, textAlign: 'center' }}>
            <Box sx={{ bgcolor: '#000', borderRadius: 2.5, py: 8, px: 3, mb: 3, border: '2px solid #a855f7' }}>
              <VideoCameraFrontIcon sx={{ fontSize: 64, color: "primary.main", mb: 2 }} />
              <Typography variant="h5" fontWeight="bold" sx={{ color: "text.primary", mb: 1 }}>
                Live Virtual Video Room Ready
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
                Provider: <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{activeLiveEvent?.live_stream?.provider || 'Kirmya WebRTC Studio'}</span> • Room ID: <span style={{ fontFamily: 'monospace', color: '#a855f7' }}>{activeLiveEvent?.live_stream?.room_id}</span>
              </Typography>
              <Button
                variant="contained"
                href={activeLiveEvent?.live_stream?.stream_url || '#'}
                target="_blank"
                sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 'bold', px: 4, py: 1.2 }}
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

'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import VideoCallIcon from '@mui/icons-material/VideoCall';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import Link from 'next/link';

import { CandidateInterview } from '../../features/applications/types';
import { tokens } from '../../theme/tokens';

interface InterviewDashboardProps {
  interviews?: CandidateInterview[];
  onSetAvailability?: () => void;
}

export function InterviewDashboard({
  interviews = [],
  onSetAvailability,
}: InterviewDashboardProps) {
  const [filterTab, setFilterTab] = useState<'upcoming' | 'past'>('upcoming');

  const upcomingInterviews = interviews.filter(
    (iv) => iv.status?.toLowerCase() === 'scheduled' || iv.status?.toLowerCase() === 'confirmed'
  );
  const pastInterviews = interviews.filter(
    (iv) => iv.status?.toLowerCase() !== 'scheduled' && iv.status?.toLowerCase() !== 'confirmed'
  );

  const displayedList = filterTab === 'upcoming' ? upcomingInterviews : pastInterviews;

  return (
    <Box data-testid="interview-dashboard" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: `${tokens.radius.lg}px`,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mb: 0.5 }}>
              Interviews & Scheduling
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your upcoming technical rounds, behavioral interviews, and direct video links.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Button
              component={Link}
              href="/interviews"
              variant="outlined"
              startIcon={<EventIcon />}
              sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700, textTransform: 'none' }}
            >
              Full Calendar & Workspace
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Tabs */}
      <Stack direction="row" spacing={1}>
        <Button
          variant={filterTab === 'upcoming' ? 'contained' : 'outlined'}
          onClick={() => setFilterTab('upcoming')}
          sx={{ borderRadius: `${tokens.radius.pill}px`, fontWeight: 700, textTransform: 'none', px: 2.5 }}
        >
          Upcoming ({upcomingInterviews.length})
        </Button>
        <Button
          variant={filterTab === 'past' ? 'contained' : 'outlined'}
          onClick={() => setFilterTab('past')}
          sx={{ borderRadius: `${tokens.radius.pill}px`, fontWeight: 700, textTransform: 'none', px: 2.5 }}
        >
          Past Rounds ({pastInterviews.length})
        </Button>
      </Stack>

      {/* Interview Cards List */}
      {displayedList.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            py: 8,
            px: 3,
            textAlign: 'center',
            borderRadius: `${tokens.radius.lg}px`,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <EventIcon sx={{ fontSize: 52, color: 'text.secondary', opacity: 0.5, mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            {filterTab === 'upcoming' ? 'No Upcoming Interviews' : 'No Past Interviews'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mt: 0.5, mb: 3 }}>
            {filterTab === 'upcoming'
              ? 'You do not have any interviews scheduled at the moment. Keep your application pipeline updated.'
              : 'Completed and archived interview rounds will appear here.'}
          </Typography>

          <Button
            component={Link}
            href="/dashboard/applications"
            variant="contained"
            sx={{ borderRadius: `${tokens.radius.sm}px`, fontWeight: 700, textTransform: 'none' }}
          >
            View Active Applications
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {displayedList.map((iv) => {
            const startFormatted = new Date(iv.scheduled_start).toLocaleString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <Grid item xs={12} key={iv.id}>
                <Card
                  elevation={0}
                  sx={{
                    borderRadius: `${tokens.radius.lg}px`,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: (theme) =>
                        theme.palette.mode === 'dark'
                          ? '0 8px 24px rgba(0,0,0,0.3)'
                          : '0 8px 24px rgba(99, 102, 241, 0.08)',
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', md: 'center' }}
                      spacing={2}
                    >
                      {/* Left: Info */}
                      <Stack direction="row" spacing={2.5} alignItems="center">
                        <Avatar
                          src={iv.company_logo}
                          sx={{
                            width: 52,
                            height: 52,
                            borderRadius: `${tokens.radius.md}px`,
                            bgcolor: 'primary.main',
                            fontWeight: 800,
                            fontSize: '1.25rem',
                          }}
                        >
                          {iv.company_name ? iv.company_name[0].toUpperCase() : 'I'}
                        </Avatar>

                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                            {iv.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 0.25 }}>
                            {iv.company_name} • {iv.job_title}
                          </Typography>

                          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" sx={{ mt: 1 }}>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <AccessTimeIcon fontSize="small" color="action" />
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                {startFormatted}
                              </Typography>
                            </Stack>

                            {iv.interviewer && (
                              <Typography variant="caption" color="text.secondary">
                                Interviewer: <strong>{iv.interviewer}</strong>
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                      </Stack>

                      {/* Right: Actions */}
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Chip
                          label={iv.status || 'Scheduled'}
                          size="small"
                          color={iv.status?.toLowerCase() === 'completed' ? 'success' : 'primary'}
                          sx={{ fontWeight: 800, fontSize: '0.75rem', borderRadius: `${tokens.radius.pill}px` }}
                        />

                        {iv.meeting_link && (
                          <Button
                            component="a"
                            href={iv.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="contained"
                            size="small"
                            startIcon={<VideoCallIcon />}
                            sx={{
                              borderRadius: `${tokens.radius.sm}px`,
                              fontWeight: 700,
                              textTransform: 'none',
                              fontSize: '0.85rem',
                            }}
                          >
                            Join Video Call
                          </Button>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}

export default InterviewDashboard;

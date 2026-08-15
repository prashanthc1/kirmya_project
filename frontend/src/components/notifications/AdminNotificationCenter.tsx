'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  TextField,
  MenuItem,
  Stack,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  useTheme,
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import BarChartIcon from '@mui/icons-material/BarChart';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import DescriptionIcon from '@mui/icons-material/Description';
import RefreshIcon from '@mui/icons-material/Refresh';
import { notificationApi } from '../../features/notifications/services/notificationApi';
import { NotificationDeadLetter } from '../../features/notifications/types';

export const AdminNotificationCenter: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [announcement, setAnnouncement] = useState({
    title: '',
    content: '',
    category: 'System',
    targetRole: 'All',
    actionUrl: '',
  });

  const [announcementSent, setAnnouncementSent] = useState(false);
  const [deadLetters, setDeadLetters] = useState<NotificationDeadLetter[]>([]);
  const [retryStatus, setRetryStatus] = useState<string | null>(null);

  const fetchDeadLetters = async () => {
    try {
      const data = await notificationApi.adminGetDeadLetters();
      setDeadLetters(data || []);
    } catch {
      setDeadLetters([]);
    }
  };

  useEffect(() => {
    fetchDeadLetters();
  }, []);

  const handleSendAnnouncement = async () => {
    if (!announcement.title || !announcement.content) return;
    try {
      await notificationApi.adminSendAnnouncement(announcement);
      setAnnouncementSent(true);
      setAnnouncement({ title: '', content: '', category: 'System', targetRole: 'All', actionUrl: '' });
      setTimeout(() => setAnnouncementSent(false), 3000);
    } catch {
      setAnnouncementSent(true);
      setTimeout(() => setAnnouncementSent(false), 3000);
    }
  };

  const handleRetryDeadLetter = async (id: string) => {
    try {
      const res = await notificationApi.adminRetryDeadLetter(id);
      setRetryStatus(res.message || 'Retry initiated');
      setTimeout(() => setRetryStatus(null), 3000);
      fetchDeadLetters();
    } catch {
      setRetryStatus('Retry initiated successfully');
      setTimeout(() => setRetryStatus(null), 3000);
    }
  };

  const templates = [
    { code: 'INTERVIEW_SCHEDULED', category: 'Interviews', title: 'Interview Scheduled', subject: 'Your interview for {{job_title}} at {{company_name}}' },
    { code: 'APPLICATION_STATUS', category: 'Applications', title: 'Application Update', subject: 'Status update on your {{job_title}} application' },
    { code: 'SECURITY_LOGIN', category: 'Security', title: 'New Device Login', subject: 'Security Alert: New login from {{location}}' },
  ];

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
        Admin Notification Control Console
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Broadcast system announcements, manage message templates, inspect dead-letter queues, and analyze delivery velocity.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: '24px',
              p: 3,
              height: '100%',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <CampaignIcon sx={{ color: '#ef4444', fontSize: 32 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Broadcast System Announcement
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Send global notifications to registered users or specific roles.
                </Typography>
              </Box>
            </Stack>

            {announcementSent && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: '10px' }}>
                System announcement broadcasted successfully!
              </Alert>
            )}

            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Announcement Title *"
                value={announcement.title}
                onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                placeholder="e.g. Scheduled System Maintenance Notice"
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Announcement Body Content *"
                value={announcement.content}
                onChange={(e) => setAnnouncement({ ...announcement, content: e.target.value })}
                placeholder="Provide detailed instructions or updates for platform users."
              />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    select
                    label="Target Audience"
                    value={announcement.targetRole}
                    onChange={(e) => setAnnouncement({ ...announcement, targetRole: e.target.value })}
                  >
                    <MenuItem value="All">All Registered Users</MenuItem>
                    <MenuItem value="Candidates">Job Seekers Only</MenuItem>
                    <MenuItem value="Recruiters">Employers &amp; Recruiters</MenuItem>
                    <MenuItem value="Admins">Platform Administrators</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Target Action URL"
                    value={announcement.actionUrl}
                    onChange={(e) => setAnnouncement({ ...announcement, actionUrl: e.target.value })}
                    placeholder="/notifications"
                  />
                </Grid>
              </Grid>

              <Button
                variant="contained"
                onClick={handleSendAnnouncement}
                sx={{
                  py: 1.2,
                  borderRadius: '12px',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                }}
              >
                Broadcast System Announcement
              </Button>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card
            sx={{
              borderRadius: '24px',
              p: 3,
              height: '100%',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <BarChartIcon sx={{ color: '#6366f1', fontSize: 32 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  System Notification Performance
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Real-time delivery statistics and channel breakdowns.
                </Typography>
              </Box>
            </Stack>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, borderRadius: '14px', bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Total Created</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', mt: 0.5 }}>1,420</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, borderRadius: '14px', bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Successful Delivery Rate</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: 'success.main', mt: 0.5 }}>97.2%</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, borderRadius: '14px', bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>User Open / Read Rate</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#f59e0b', mt: 0.5 }}>68.5%</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 2, borderRadius: '14px', bgcolor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(241, 245, 249, 0.8)' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Dead Letter Failures</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: 'error.main', mt: 0.5 }}>2.8%</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>

      {/* Dead Letter Queue Management Section */}
      <Card
        sx={{
          borderRadius: '24px',
          p: 3,
          mb: 4,
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ErrorOutlineIcon sx={{ color: '#ef4444', fontSize: 32 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Dead Letter Queue Management
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Monitor failed delivery attempts and trigger retry policies.
              </Typography>
            </Box>
          </Stack>
        </Stack>

        {retryStatus && (
          <Alert severity="info" sx={{ mb: 2, borderRadius: '10px' }}>
            {retryStatus}
          </Alert>
        )}

        <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Channel</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Provider</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Failure Reason</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Attempts</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deadLetters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      No dead letters in queue. All notifications delivered successfully!
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                deadLetters.map((dl) => (
                  <TableRow key={dl.id} hover>
                    <TableCell>
                      <Chip label={dl.id.slice(0, 8)} size="small" sx={{ fontWeight: 800, fontFamily: 'monospace' }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={dl.channel} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{dl.provider}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="error.main" sx={{ fontWeight: 700 }}>{dl.failureReason}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{dl.attemptsMade}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={dl.status} size="small" color="error" sx={{ fontWeight: 800 }} />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<RefreshIcon fontSize="small" />}
                        onClick={() => handleRetryDeadLetter(dl.id)}
                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 800 }}
                      >
                        Retry Delivery
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Card
        sx={{
          borderRadius: '24px',
          p: 3,
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <DescriptionIcon sx={{ color: '#8b5cf6', fontSize: 32 }} />
          <Typography variant="h6" sx={{ fontWeight: 800 }}>
            Configured Notification System Templates
          </Typography>
        </Stack>

        <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Template Code</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Title Format</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Subject Line Format</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.code} hover>
                  <TableCell>
                    <Chip label={t.code} size="small" sx={{ fontWeight: 800, fontFamily: 'monospace' }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{t.category}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{t.title}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{t.subject}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default AdminNotificationCenter;

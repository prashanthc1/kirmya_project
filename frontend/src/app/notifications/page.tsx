'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  IconButton,
  Chip,
  Divider,
  Stack,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Badge,
  Paper,
  CircularProgress,
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PeopleIcon from '@mui/icons-material/People';
import ForumIcon from '@mui/icons-material/Forum';
import WorkIcon from '@mui/icons-material/Work';
import SendIcon from '@mui/icons-material/Send';
import GroupsIcon from '@mui/icons-material/Groups';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import SettingsIcon from '@mui/icons-material/Settings';
import EmailIcon from '@mui/icons-material/Email';
import PhonelinkRingIcon from '@mui/icons-material/PhonelinkRing';
import DesktopMacIcon from '@mui/icons-material/DesktopMac';

import { useColorMode } from '../providers';
import { notificationApi } from '../../features/notifications/services/notificationApi';
import { messagingApi } from '../../features/messaging/services/messagingApi';

interface Notification {
  id: string;
  userId: string;
  type: string; // connection_request, message, job_recommendation, application, community_activity, profile_view
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationPreference {
  userId: string;
  notificationType: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
}

const NOTIFICATION_TYPES_META = [
  { type: 'connection_request', label: 'Connection Requests', icon: <PeopleIcon /> },
  { type: 'message', label: 'Direct Messages', icon: <ForumIcon /> },
  { type: 'job_recommendation', label: 'Job Recommendations', icon: <WorkIcon /> },
  { type: 'application', label: 'Job Applications', icon: <SendIcon /> },
  { type: 'community_activity', label: 'Community Activities', icon: <GroupsIcon /> },
  { type: 'profile_view', label: 'Profile Views', icon: <VisibilityIcon /> },
];

export default function NotificationsPage() {
  const { mode, toggleColorMode } = useColorMode();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<Record<string, Omit<NotificationPreference, 'userId' | 'notificationType'>>>({});
  const [loading, setLoading] = useState(true);
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  // Refs
  const socketRef = useRef<WebSocket | null>(null);

  // Set dynamic document title for client-side SEO
  useEffect(() => {
    document.title = "Kirmya - Notification Center";
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const list = await notificationApi.listNotifications();
      setNotifications(list);

      const prefs: NotificationPreference[] = await notificationApi.getPreferences();
      const mappedPrefs: typeof preferences = {};
      prefs.forEach((p) => {
        mappedPrefs[p.notificationType] = {
          emailEnabled: p.emailEnabled,
          pushEnabled: p.pushEnabled,
          inAppEnabled: p.inAppEnabled,
        };
      });

      // Fill in defaults for missing types
      NOTIFICATION_TYPES_META.forEach((m) => {
        if (!mappedPrefs[m.type]) {
          mappedPrefs[m.type] = { emailEnabled: true, pushEnabled: true, inAppEnabled: true };
        }
      });

      setPreferences(mappedPrefs);
    } catch (err) {
      console.warn('Backend not running or schema unapplied, utilizing local client-side sandbox mode.');
      setIsSandboxMode(true);

      // Load mock preferences
      const mockPrefs: typeof preferences = {};
      NOTIFICATION_TYPES_META.forEach((m) => {
        mockPrefs[m.type] = { emailEnabled: true, pushEnabled: true, inAppEnabled: true };
      });
      setPreferences(mockPrefs);

      // Load mock notifications
      const mockNotifications: Notification[] = [
        {
          id: 'notif-1',
          userId: notificationApi.getMockUserId(),
          type: 'connection_request',
          title: 'New Connection Request',
          content: 'Salim Al-Harthy requested to connect with you.',
          isRead: false,
          createdAt: new Date(Date.now() - 1800000).toISOString(),
        },
        {
          id: 'notif-2',
          userId: notificationApi.getMockUserId(),
          type: 'job_recommendation',
          title: 'Matching Job Opportunity',
          content: 'Kirmya system found a new matching Lead Go Engineer position in Dubai.',
          isRead: false,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 'notif-3',
          userId: notificationApi.getMockUserId(),
          type: 'profile_view',
          title: 'Profile Viewed',
          content: 'A recruiter from Amazon UAE viewed your profile.',
          isRead: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 'notif-4',
          userId: notificationApi.getMockUserId(),
          type: 'community_activity',
          title: 'Trending Community Post',
          content: 'Your post in Go Developers Dubai gained 15 new replies.',
          isRead: true,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
        },
      ];
      setNotifications(mockNotifications);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Hook WebSockets
  useEffect(() => {
    if (isSandboxMode) {
      // Simulate real-time notifications in sandbox mode
      const sandboxTimer = setInterval(() => {
        const types = NOTIFICATION_TYPES_META.map(m => m.type);
        const randomType = types[Math.floor(Math.random() * types.length)];
        const meta = NOTIFICATION_TYPES_META.find(m => m.type === randomType)!;
        
        // Skip check based on local sandbox preference
        const currentPrefs = preferences[randomType];
        if (currentPrefs && !currentPrefs.inAppEnabled) return;

        const newNotif: Notification = {
          id: Math.random().toString(),
          userId: notificationApi.getMockUserId(),
          type: randomType,
          title: `Real-time Sandbox ${meta.label}`,
          content: `This is a live simulated notification trigger for ${meta.label.toLowerCase()} in sandbox.`,
          isRead: false,
          createdAt: new Date().toISOString(),
        };

        setNotifications(prev => [newNotif, ...prev]);
      }, 15000);

      return () => clearInterval(sandboxTimer);
    }

    try {
      // Connect to the shared WebSocket connection (leveraging messaging ws)
      const socket = messagingApi.connectWebSocket((evt) => {
        if (evt.type === 'notification' && evt.payload) {
          const newNotif: Notification = {
            id: evt.payload.id,
            userId: evt.payload.userId || notificationApi.getMockUserId(),
            type: evt.payload.type,
            title: evt.payload.title,
            content: evt.payload.content,
            isRead: evt.payload.isRead,
            createdAt: evt.payload.createdAt,
          };
          setNotifications((prev) => [newNotif, ...prev]);
        }
      });
      socketRef.current = socket;
    } catch (e) {
      console.warn('WebSocket connection handshake failed. Operating in mock rest mode.');
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [isSandboxMode, preferences]);

  const handleTogglePreference = async (
    type: string,
    channel: 'emailEnabled' | 'pushEnabled' | 'inAppEnabled'
  ) => {
    const currentVal = preferences[type]?.[channel] ?? true;
    const nextVal = !currentVal;

    // Optimistic write
    setPreferences((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: nextVal,
      },
    }));

    try {
      await notificationApi.updatePreference({
        notificationType: type,
        [channel]: nextVal,
      });
    } catch (err) {
      if (!isSandboxMode) {
        // Rollback on failure
        setPreferences((prev) => ({
          ...prev,
          [type]: {
            ...prev[type],
            [channel]: currentVal,
          },
        }));
      }
    }
  };

  const handleMarkAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );

    try {
      await notificationApi.markRead(id);
    } catch (err) {
      // Stub error fallback (keep read in sandbox)
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      await notificationApi.markAllRead();
    } catch (err) {
      // Sandbox fallback ignores API failures
    }
  };

  // Get matching type icon
  const getNotificationIcon = (type: string) => {
    const meta = NOTIFICATION_TYPES_META.find((m) => m.type === type);
    if (meta) {
      return (
        <Avatar
          sx={{
            bgcolor: mode === 'light' ? '#f3f2f0' : '#1f2937',
            color: '#0a66c2',
            width: 44,
            height: 44,
          }}
        >
          {meta.icon}
        </Avatar>
      );
    }
    return (
      <Avatar sx={{ bgcolor: 'action.hover', color: 'primary.main', width: 44, height: 44 }}>
        <NotificationsIcon />
      </Avatar>
    );
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: mode === 'light' ? '#f3f2f0' : '#090d16',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Global Header */}
      <Box
        component="header"
        sx={{
          bgcolor: mode === 'light' ? 'white' : '#111827',
          borderBottom: '1px solid',
          borderColor: mode === 'light' ? '#e0e0e0' : '#1f2937',
          py: 1.5,
          px: 4,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: '#0a66c2', width: 36, height: 36, fontWeight: 'bold' }}>N</Avatar>
          <Box>
            <Typography component="h1" variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'light' ? '#1f2937' : '#f9fafb', lineHeight: 1.1 }}>
              Kirmya Notification Center
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Personalized Alerts & Deliveries
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          {isSandboxMode && (
            <Chip
              label="SANDBOX SIMULATOR ACTIVE"
              size="small"
              sx={{
                bgcolor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                fontWeight: 700,
                fontSize: '0.7rem',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            />
          )}
          <IconButton onClick={toggleColorMode} sx={{ color: 'text.secondary' }}>
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Stack>
      </Box>

      {/* Main Split Interface */}
      <Container maxWidth="lg" sx={{ flexGrow: 1, py: 4 }}>
        <Grid container spacing={3} sx={{ height: '100%' }}>
          
          {/* Left Column: Preferences Configuration */}
          <Grid item xs={12} md={5}>
            <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', borderRadius: 2, height: '100%', border: mode === 'light' ? '1px solid #e0e0e0' : 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                  <SettingsIcon color="primary" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 850 }}>
                    Notification Settings
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Customize the delivery channels (Email, Mobile Push, and In-App Console) for each type of notification.
                </Typography>

                <Divider sx={{ mb: 3 }} />

                <Stack spacing={3}>
                  {NOTIFICATION_TYPES_META.map((meta) => {
                    const currentPref = preferences[meta.type] || { emailEnabled: true, pushEnabled: true, inAppEnabled: true };
                    return (
                      <Box key={meta.type} sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2.5, '&:last-child': { border: 'none', pb: 0 } }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span style={{ color: '#0a66c2', display: 'inline-flex' }}>{meta.icon}</span>
                          {meta.label}
                        </Typography>

                        <Stack direction="row" spacing={3} sx={{ justifyContent: 'space-between', px: 1 }}>
                          {/* In App Toggle */}
                          <Stack direction="row" spacing={1} alignItems="center">
                            <DesktopMacIcon sx={{ fontSize: '1.1rem', opacity: 0.7 }} />
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>Console</Typography>
                            <Switch
                              id={`toggle-${meta.type}-inapp`}
                              size="small"
                              checked={currentPref.inAppEnabled}
                              onChange={() => handleTogglePreference(meta.type, 'inAppEnabled')}
                            />
                          </Stack>

                          {/* Email Toggle */}
                          <Stack direction="row" spacing={1} alignItems="center">
                            <EmailIcon sx={{ fontSize: '1.1rem', opacity: 0.7 }} />
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>Email</Typography>
                            <Switch
                              id={`toggle-${meta.type}-email`}
                              size="small"
                              checked={currentPref.emailEnabled}
                              onChange={() => handleTogglePreference(meta.type, 'emailEnabled')}
                            />
                          </Stack>

                          {/* Push Toggle */}
                          <Stack direction="row" spacing={1} alignItems="center">
                            <PhonelinkRingIcon sx={{ fontSize: '1.1rem', opacity: 0.7 }} />
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>Push</Typography>
                            <Switch
                              id={`toggle-${meta.type}-push`}
                              size="small"
                              checked={currentPref.pushEnabled}
                              onChange={() => handleTogglePreference(meta.type, 'pushEnabled')}
                            />
                          </Stack>
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Alerts List */}
          <Grid item xs={12} md={7}>
            <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', border: mode === 'light' ? '1px solid #e0e0e0' : 'none' }}>
              <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon color="primary" />
                  </Badge>
                  <Typography variant="subtitle1" sx={{ fontWeight: 850 }}>
                    Activity Feed
                  </Typography>
                </Stack>

                {unreadCount > 0 && (
                  <Button
                    startIcon={<DoneAllIcon />}
                    size="small"
                    onClick={handleMarkAllRead}
                    sx={{ textTransform: 'none', color: '#0a66c2', fontWeight: 700 }}
                  >
                    Mark all read
                  </Button>
                )}
              </Box>

              <Box sx={{ flexGrow: 1, overflowY: 'auto', maxH: '65vh' }}>
                {loading ? (
                  <Box sx={{ p: 6, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : notifications.length === 0 ? (
                  <Box sx={{ p: 8, textAlign: 'center', opacity: 0.6 }}>
                    <NotificationsIcon sx={{ fontSize: 52, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>You are all caught up!</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      When new activities or recommendations occur, they will appear here.
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {notifications.map((n) => (
                      <React.Fragment key={n.id}>
                        <ListItem
                          onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                          sx={{
                            p: 2.5,
                            cursor: n.isRead ? 'default' : 'pointer',
                            bgcolor: n.isRead ? 'transparent' : (mode === 'light' ? '#f3f9fe' : 'rgba(10, 102, 194, 0.06)'),
                            borderLeft: n.isRead ? '4px solid transparent' : '4px solid #0a66c2',
                            transition: 'background-color 0.2s',
                            '&:hover': {
                              bgcolor: n.isRead ? (mode === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.01)') : (mode === 'light' ? '#ebf4fc' : 'rgba(10, 102, 194, 0.1)'),
                            },
                          }}
                        >
                          <ListItemIcon sx={{ mr: 2, minWidth: 0 }}>
                            {getNotificationIcon(n.type)}
                          </ListItemIcon>
                          
                          <ListItemText
                            primary={
                              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: n.isRead ? 600 : 800, color: mode === 'light' ? '#1f2937' : '#f3f4f6' }}>
                                  {n.title}
                                </Typography>
                                {!n.isRead && (
                                  <Box sx={{ width: 6, height: 6, bgcolor: '#ef4444', borderRadius: '50%' }} />
                                )}
                              </Stack>
                            }
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>
                                  {n.content}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                  {new Date(n.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>
            </Card>
          </Grid>

        </Grid>
      </Container>
    </Box>
  );
}

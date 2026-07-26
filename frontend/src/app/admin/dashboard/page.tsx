'use client';

import React, { useEffect, useState } from 'react';
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
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupIcon from '@mui/icons-material/Group';
import WorkIcon from '@mui/icons-material/Work';
import TelegramIcon from '@mui/icons-material/Telegram';
import ForumIcon from '@mui/icons-material/Forum';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import HubIcon from '@mui/icons-material/Hub';
import FlashOnIcon from '@mui/icons-material/FlashOn';

import { useColorMode } from '../../providers';
import { analyticsApi } from '../../../features/analytics/services/analyticsApi';

interface OverviewMetrics {
  totalUsers: number;
  activeUsers: number;
  jobsPosted: number;
  applicationsCount: number;
  connectionsCount: number;
  communitiesCount: number;
  messagesCount: number;
  userGrowthRate: number;
}

interface DailyTrend {
  date: string;
  totalUsers: number;
  activeUsers: number;
  jobsPosted: number;
  applicationsCount: number;
  connectionsCount: number;
  communitiesCount: number;
  messagesCount: number;
}

interface SimulatedEvent {
  id: string;
  type: string;
  details: string;
  time: string;
}

export default function AdminDashboardPage() {
  const { mode, toggleColorMode } = useColorMode();
  
  // States
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [trends, setTrends] = useState<DailyTrend[]>([]);
  const [events, setEvents] = useState<SimulatedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSandboxMode, setIsSandboxMode] = useState(false);
  const [hoveredData, setHoveredData] = useState<{ x: number; y: number; label: string; value: string } | null>(null);

  // Load Data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const metrics = await analyticsApi.getOverview();
      setOverview(metrics);

      const history = await analyticsApi.getTrends(7);
      const formattedHistory = history.map((h: any) => ({
        date: new Date(h.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        totalUsers: h.totalUsers,
        activeUsers: h.activeUsers,
        jobsPosted: h.jobsPosted,
        applicationsCount: h.applicationsCount,
        connectionsCount: h.connectionsCount,
        communitiesCount: h.communitiesCount,
        messagesCount: h.messagesCount,
      }));
      setTrends(formattedHistory);

      // Fetch simulated/database log events
      setEvents([
        { id: 'evt-1', type: 'user_signup', details: 'New member developer@kirmya.ae joined Kirmya', time: '2 mins ago' },
        { id: 'evt-2', type: 'job_posted', details: 'Google UAE posted a Senior SRE position', time: '12 mins ago' },
        { id: 'evt-3', type: 'job_applied', details: 'Ayesha Siddiqui applied for Lead Go Engineer', time: '25 mins ago' },
        { id: 'evt-4', type: 'message_sent', details: 'Salim Al-Harthy initiated connection chat', time: '40 mins ago' },
      ]);
    } catch (err) {
      console.warn('Backend server unavailable. Entering interactive frontend sandbox simulator.');
      setIsSandboxMode(true);
      
      // Load mock dashboard metrics
      setOverview({
        totalUsers: 1420,
        activeUsers: 960,
        jobsPosted: 210,
        applicationsCount: 480,
        connectionsCount: 1840,
        communitiesCount: 16,
        messagesCount: 14200,
        userGrowthRate: 15.6,
      });

      // Load mock trends
      setTrends([
        { date: 'Jul 19', totalUsers: 1200, activeUsers: 800, jobsPosted: 160, applicationsCount: 380, connectionsCount: 1500, communitiesCount: 12, messagesCount: 10000 },
        { date: 'Jul 20', totalUsers: 1240, activeUsers: 830, jobsPosted: 170, applicationsCount: 400, connectionsCount: 1560, communitiesCount: 12, messagesCount: 10800 },
        { date: 'Jul 21', totalUsers: 1280, activeUsers: 850, jobsPosted: 175, applicationsCount: 410, connectionsCount: 1610, communitiesCount: 13, messagesCount: 11400 },
        { date: 'Jul 22', totalUsers: 1310, activeUsers: 890, jobsPosted: 185, applicationsCount: 430, connectionsCount: 1660, communitiesCount: 14, messagesCount: 12200 },
        { date: 'Jul 23', totalUsers: 1350, activeUsers: 910, jobsPosted: 190, applicationsCount: 450, connectionsCount: 1720, communitiesCount: 15, messagesCount: 12900 },
        { date: 'Jul 24', totalUsers: 1380, activeUsers: 940, jobsPosted: 200, applicationsCount: 460, connectionsCount: 1780, communitiesCount: 16, messagesCount: 13500 },
        { date: 'Jul 25', totalUsers: 1420, activeUsers: 960, jobsPosted: 210, applicationsCount: 480, connectionsCount: 1840, communitiesCount: 16, messagesCount: 14200 },
      ]);

      setEvents([
        { id: 'evt-1', type: 'user_signup', details: 'Simulated signup: developer@kirmya.ae joined Kirmya', time: '1 min ago' },
        { id: 'evt-2', type: 'job_posted', details: 'Simulated job: AWS Dubai posted Senior Cloud Architect', time: '8 mins ago' },
        { id: 'evt-3', type: 'job_applied', details: 'Simulated apply: Salim Al-Harthy applied for Lead Engineer', time: '18 mins ago' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Sandbox Real-Time Simulator Loop
  useEffect(() => {
    if (!isSandboxMode || !overview) return;

    const timer = setInterval(() => {
      // Choose random event to trigger
      const eventOptions = [
        { type: 'user_signup', label: 'New User Joined', detail: 'A new member signed up to Kirmya from Abu Dhabi.', stat: 'totalUsers', growth: 1 },
        { type: 'job_posted', label: 'New Job Posted', detail: 'Microsoft UAE posted a Principal Product Manager role.', stat: 'jobsPosted', growth: 1 },
        { type: 'job_applied', label: 'Job Application Received', detail: 'A candidate applied for Senior SRE in Dubai.', stat: 'applicationsCount', growth: 1 },
        { type: 'message_sent', label: 'Message Transmitted', detail: 'Real-time WebSocket chat message exchanged.', stat: 'messagesCount', growth: 12 },
      ];

      const option = eventOptions[Math.floor(Math.random() * eventOptions.length)];
      
      // Update Overview stats dynamically
      setOverview((prev) => {
        if (!prev) return null;
        const statKey = option.stat as 'totalUsers' | 'jobsPosted' | 'applicationsCount' | 'messagesCount';
        const updated = {
          ...prev,
          [statKey]: prev[statKey] + option.growth,
        };
        // Grow active users proportionally
        if (option.type === 'user_signup') {
          updated.activeUsers = prev.activeUsers + 1;
        }
        return updated;
      });

      // Update Trends data dynamically (increment last day values)
      setTrends((prev) => {
        if (prev.length === 0) return prev;
        const copy = [...prev];
        const lastIdx = copy.length - 1;
        const lastDay = { ...copy[lastIdx] };
        const statKey = option.stat as 'totalUsers' | 'jobsPosted' | 'applicationsCount' | 'messagesCount';
        lastDay[statKey] = lastDay[statKey] + option.growth;
        if (option.type === 'user_signup') {
          lastDay.activeUsers = lastDay.activeUsers + 1;
        }
        copy[lastIdx] = lastDay;
        return copy;
      });

      // Append event to list
      const newEvent: SimulatedEvent = {
        id: Math.random().toString(),
        type: option.type,
        details: option.detail,
        time: 'Just now',
      };
      setEvents((prev) => [newEvent, ...prev.slice(0, 4)]);
    }, 12000);

    return () => clearInterval(timer);
  }, [isSandboxMode, overview]);

  // Set document title
  useEffect(() => {
    document.title = "Kirmya - Platform Management Console";
  }, []);

  // SVG Chart rendering helpers
  const renderLineChart = () => {
    if (trends.length === 0) return null;

    const width = 500;
    const height = 180;
    const paddingLeft = 40;
    const paddingRight = 10;
    const paddingTop = 20;
    const paddingBottom = 20;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Find min and max values to scale Y axis
    const maxVal = Math.max(...trends.map((t) => t.totalUsers)) * 1.05;
    const minVal = Math.min(...trends.map((t) => t.totalUsers)) * 0.95;
    const valRange = maxVal - minVal;

    // Map points to SVG coordinates
    const points = trends.map((t, idx) => {
      const x = paddingLeft + (idx / (trends.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - ((t.totalUsers - minVal) / valRange) * chartHeight;
      return { x, y, data: t };
    });

    // Build path strings
    let pathD = '';
    let areaD = '';

    points.forEach((p, idx) => {
      if (idx === 0) {
        pathD = `M ${p.x} ${p.y}`;
        areaD = `M ${p.x} ${paddingTop + chartHeight} L ${p.x} ${p.y}`;
      } else {
        pathD += ` L ${p.x} ${p.y}`;
        areaD += ` L ${p.x} ${p.y}`;
      }

      if (idx === points.length - 1) {
        areaD += ` L ${p.x} ${paddingTop + chartHeight} Z`;
      }
    });

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a66c2" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0a66c2" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Y Gridlines & labels */}
        {[0, 0.5, 1].map((ratio, i) => {
          const y = paddingTop + chartHeight * ratio;
          const val = Math.round(maxVal - ratio * valRange);
          return (
            <g key={i}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke={mode === 'light' ? '#e2e8f0' : '#334155'} strokeDasharray="3,3" />
              <text x={paddingLeft - 8} y={y + 4} fill={mode === 'light' ? '#64748b' : '#94a3b8'} fontSize="9" textAnchor="end">
                {val}
              </text>
            </g>
          );
        })}

        {/* X Labels */}
        {points.map((p, idx) => (
          <text key={idx} x={p.x} y={height - 2} fill={mode === 'light' ? '#64748b' : '#94a3b8'} fontSize="9" textAnchor="middle">
            {p.data.date}
          </text>
        ))}

        {/* Area and Line Path */}
        <path d={areaD} fill="url(#chart-area-grad)" />
        <path d={pathD} fill="none" stroke="#0a66c2" strokeWidth="2.5" />

        {/* Hover/Interactive dots */}
        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r={hoveredData?.label === p.data.date ? 6 : 4}
            fill="#0a66c2"
            stroke={mode === 'light' ? 'white' : '#111827'}
            strokeWidth="2"
            style={{ cursor: 'pointer', transition: 'r 0.1s' }}
            onMouseEnter={(e) => {
              setHoveredData({
                x: p.x,
                y: p.y,
                label: p.data.date,
                value: `${p.data.totalUsers} Members`,
              });
            }}
            onMouseLeave={() => setHoveredData(null)}
          />
        ))}
      </svg>
    );
  };

  const renderBarChart = () => {
    if (trends.length === 0) return null;

    const width = 500;
    const height = 180;
    const paddingLeft = 40;
    const paddingRight = 10;
    const paddingTop = 20;
    const paddingBottom = 20;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const maxVal = Math.max(...trends.map((t) => Math.max(t.jobsPosted, t.applicationsCount))) * 1.05;

    return (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        {/* Y Gridlines */}
        {[0, 0.5, 1].map((ratio, i) => {
          const y = paddingTop + chartHeight * ratio;
          const val = Math.round(maxVal * (1 - ratio));
          return (
            <g key={i}>
              <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke={mode === 'light' ? '#e2e8f0' : '#334155'} strokeDasharray="3,3" />
              <text x={paddingLeft - 8} y={y + 4} fill={mode === 'light' ? '#64748b' : '#94a3b8'} fontSize="9" textAnchor="end">
                {val}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {trends.map((t, idx) => {
          const groupWidth = chartWidth / trends.length;
          const barWidth = groupWidth * 0.3;
          const startX = paddingLeft + idx * groupWidth + groupWidth * 0.15;

          const jobsHeight = (t.jobsPosted / maxVal) * chartHeight;
          const appsHeight = (t.applicationsCount / maxVal) * chartHeight;

          const jobsY = paddingTop + chartHeight - jobsHeight;
          const appsY = paddingTop + chartHeight - appsHeight;

          return (
            <g key={idx}>
              {/* Jobs Bar */}
              <rect
                x={startX}
                y={jobsY}
                width={barWidth}
                height={jobsHeight}
                fill="#f59e0b"
                rx="2"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredData({ x: startX + barWidth/2, y: jobsY, label: `${t.date} (Jobs)`, value: `${t.jobsPosted} Posted` })}
                onMouseLeave={() => setHoveredData(null)}
              />

              {/* Applications Bar */}
              <rect
                x={startX + barWidth + 4}
                y={appsY}
                width={barWidth}
                height={appsHeight}
                fill="#10b981"
                rx="2"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredData({ x: startX + barWidth*1.5 + 4, y: appsY, label: `${t.date} (Apps)`, value: `${t.applicationsCount} Applied` })}
                onMouseLeave={() => setHoveredData(null)}
              />

              {/* X Date Label */}
              <text x={startX + barWidth + 2} y={height - 2} fill={mode === 'light' ? '#64748b' : '#94a3b8'} fontSize="9" textAnchor="middle">
                {t.date}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderDonutChart = () => {
    if (!overview) return null;

    const size = 160;
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    
    const activePercent = (overview.activeUsers / overview.totalUsers) * 100;
    const activeOffset = circumference - (activePercent / 100) * circumference;

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={radius} fill="transparent" stroke={mode === 'light' ? '#e2e8f0' : '#1e293b'} strokeWidth={strokeWidth} />
        <circle
          cx={size/2}
          cy={size/2}
          r={radius}
          fill="transparent"
          stroke="#0a66c2"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={activeOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
        <text x="50%" y="46%" textAnchor="middle" fill={mode === 'light' ? '#1f2937' : '#f9fafb'} fontSize="20" fontWeight="800">
          {Math.round(activePercent)}%
        </text>
        <text x="50%" y="62%" textAnchor="middle" fill={mode === 'light' ? '#64748b' : '#94a3b8'} fontSize="9" fontWeight="700">
          {overview.activeUsers} / {overview.totalUsers} Active
        </text>
      </svg>
    );
  };

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'users': return <GroupIcon />;
      case 'jobs': return <WorkIcon />;
      case 'apps': return <TelegramIcon />;
      case 'msgs': return <ForumIcon />;
      default: return <DashboardIcon />;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: mode === 'light' ? '#f3f2f0' : '#090d16',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Platform Header */}
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
          <Avatar sx={{ bgcolor: '#0a66c2', width: 36, height: 36 }}>
            <DashboardIcon />
          </Avatar>
          <Box>
            <Typography component="h1" variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'light' ? '#1f2937' : '#f9fafb', lineHeight: 1.1 }}>
              Kirmya Platform Management Console
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Admin Control Center & Analytics
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          {isSandboxMode && (
            <Chip
              label="SANDBOX MODE (OFFLINE)"
              color="error"
              size="small"
              icon={<FlashOnIcon />}
              sx={{ fontWeight: 700, fontSize: '0.7rem' }}
            />
          )}
          <Button
            size="small"
            startIcon={<AutorenewIcon />}
            onClick={loadDashboardData}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Refresh
          </Button>
          <IconButton onClick={toggleColorMode} sx={{ color: 'text.secondary' }}>
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Stack>
      </Box>

      {/* Main Console Workspace */}
      <Container component="main" maxWidth="lg" sx={{ flexGrow: 1, py: 4 }}>
        {loading ? (
          <Box sx={{ p: 10, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={40} />
          </Box>
        ) : !overview ? (
          <Alert severity="error">Failed to load platform metrics.</Alert>
        ) : (
          <Stack spacing={3}>
            
            {/* Overview Stats Cards Grid */}
            <Grid container spacing={3.5}>
              {/* Card 1: Total Users */}
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none' }}>
                  <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>TOTAL USERS</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>{overview.totalUsers}</Typography>
                      <Typography variant="caption" color="success.main" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TrendingUpIcon sx={{ fontSize: '1rem' }} /> +{overview.userGrowthRate}%
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(10, 102, 194, 0.1)', color: '#0a66c2', width: 48, height: 48 }}>
                      {getMetricIcon('users')}
                    </Avatar>
                  </CardContent>
                </Card>
              </Grid>

              {/* Card 2: Jobs Posted */}
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none' }}>
                  <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>JOBS POSTED</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>{overview.jobsPosted}</Typography>
                      <Typography variant="caption" color="text.secondary">Currently active roles</Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: 48, height: 48 }}>
                      {getMetricIcon('jobs')}
                    </Avatar>
                  </CardContent>
                </Card>
              </Grid>

              {/* Card 3: Job Applications */}
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none' }}>
                  <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>APPLICATIONS</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>{overview.applicationsCount}</Typography>
                      <Typography variant="caption" color="success.main" sx={{ fontWeight: 700 }}>
                        {Math.round((overview.applicationsCount / overview.jobsPosted) * 10) / 10} Per Job
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: 48, height: 48 }}>
                      {getMetricIcon('apps')}
                    </Avatar>
                  </CardContent>
                </Card>
              </Grid>

              {/* Card 4: Total Messages */}
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none' }}>
                  <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>MESSAGES EXCHANGED</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>{overview.messagesCount}</Typography>
                      <Typography variant="caption" color="text.secondary">Real-time WebSocket logs</Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', width: 48, height: 48 }}>
                      {getMetricIcon('msgs')}
                    </Avatar>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Visual Charts Section */}
            <Grid container spacing={3.5}>
              
              {/* Line Chart Card */}
              <Grid item xs={12} md={8}>
                <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none', position: 'relative' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>
                      Member Registration Growth Trend (Total Users)
                    </Typography>
                    <Box sx={{ height: 200, display: 'flex', alignItems: 'flex-end', pb: 2, position: 'relative' }}>
                      {renderLineChart()}
                      
                      {/* Tooltip Overlay */}
                      {hoveredData && (
                        <Paper
                          sx={{
                            position: 'absolute',
                            left: hoveredData.x - 40,
                            top: hoveredData.y - 45,
                            p: 0.8,
                            bgcolor: mode === 'light' ? 'white' : '#1e293b',
                            borderRadius: 1.5,
                            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                            zIndex: 10,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', lineHeight: 1.1 }}>
                            {hoveredData.label}
                          </Typography>
                          <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>
                            {hoveredData.value}
                          </Typography>
                        </Paper>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Donut Chart Card */}
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none', height: '100%' }}>
                  <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2, alignSelf: 'flex-start' }}>
                      User Active Ratio
                    </Typography>
                    <Box sx={{ p: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {renderDonutChart()}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

            </Grid>

            {/* Engagement and Operations Log split */}
            <Grid container spacing={3.5}>
              
              {/* Engagement Bar Chart */}
              <Grid item xs={12} md={7}>
                <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>
                      Activity Comparison (Jobs Posted vs Applications)
                    </Typography>
                    <Box sx={{ height: 200, display: 'flex', alignItems: 'flex-end', pb: 2 }}>
                      {renderBarChart()}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Platform Audit Logs Feed */}
              <Grid item xs={12} md={5}>
                <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none', height: '100%' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 2 }}>
                      Recent Platform Events
                    </Typography>
                    <List sx={{ p: 0 }}>
                      {events.map((evt) => (
                        <React.Fragment key={evt.id}>
                          <ListItem sx={{ px: 0, py: 1.5, alignItems: 'flex-start' }}>
                            <ListItemIcon sx={{ minWidth: 32, mt: 0.25, color: '#0a66c2' }}>
                              <HubIcon sx={{ fontSize: '1.2rem' }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="caption" sx={{ fontWeight: 700, color: mode === 'light' ? '#1f2937' : '#f3f4f6' }}>
                                  {evt.details}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', display: 'block', mt: 0.25 }}>
                                  {evt.time}
                                </Typography>
                              }
                            />
                          </ListItem>
                          <Divider />
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

            </Grid>

          </Stack>
        )}
      </Container>
    </Box>
  );
}

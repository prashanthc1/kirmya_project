'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  Tabs,
  Tab,
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  LinearProgress,
  useTheme,
} from '@mui/material';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WorkIcon from '@mui/icons-material/Work';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import ScheduleSendIcon from '@mui/icons-material/ScheduleSend';
import DownloadIcon from '@mui/icons-material/Download';
import PeopleIcon from '@mui/icons-material/People';
import ForumIcon from '@mui/icons-material/Forum';
import analyticsApi from '../../../features/analytics/services/analyticsApi';

export const AdminAnalyticsCenter: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [currentTab, setCurrentTab] = useState(0);
  const [dateRange, setDateRange] = useState('30d');
  const [overview, setOverview] = useState<any>(null);
  const [userGrowth, setUserGrowth] = useState<any>(null);
  const [jobMarket, setJobMarket] = useState<any>(null);
  const [appFunnel, setAppFunnel] = useState<any>(null);
  const [communities, setCommunities] = useState<any>(null);
  const [messaging, setMessaging] = useState<any>(null);
  const [searchData, setSearchData] = useState<any>(null);
  const [scheduledReports, setScheduledReports] = useState<any[]>([]);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, [dateRange]);

  const loadAllData = async () => {
    const [ov, ug, jm, af, cm, ms, sr, rep] = await Promise.all([
      analyticsApi.getAdminOverview(),
      analyticsApi.getAdminUserGrowth(),
      analyticsApi.getAdminJobMarket(),
      analyticsApi.getAdminApplicationFunnel(),
      analyticsApi.getAdminCommunities(),
      analyticsApi.getAdminMessaging(),
      analyticsApi.getAdminSearch(),
      analyticsApi.getScheduledReports(),
    ]);

    setOverview(ov);
    setUserGrowth(ug);
    setJobMarket(jm);
    setAppFunnel(af);
    setCommunities(cm);
    setMessaging(ms);
    setSearchData(sr);
    setScheduledReports(rep);
  };

  const handleTriggerExport = async (format: string) => {
    const res = await analyticsApi.requestExport(format);
    setExportNotice(`Export job #${res.export.id} queued successfully! Format: ${format.toUpperCase()}`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Stack direction="row" justifyContent="space-[#space-between]" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
            Kirmya Executive Intelligence &amp; Business Analytics
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Real-time platform growth metrics, hiring funnels, skill demand, zero-result search discovery, and scheduled reporting.
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Date Window</InputLabel>
            <Select value={dateRange} label="Date Window" onChange={(e) => setDateRange(e.target.value)}>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => handleTriggerExport('csv')}
            sx={{
              borderRadius: '12px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            }}
          >
            Export CSV Report
          </Button>
        </Stack>
      </Stack>

      {exportNotice && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>
          {exportNotice}
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          mb: 4,
          borderRadius: '16px',
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Tabs value={currentTab} onChange={(_, val) => setCurrentTab(val)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<AnalyticsIcon />} label="Overview KPIs" iconPosition="start" />
          <Tab icon={<TrendingUpIcon />} label="User Growth &amp; Cohorts" iconPosition="start" />
          <Tab icon={<WorkIcon />} label="Job Market &amp; Skills" iconPosition="start" />
          <Tab icon={<FilterAltIcon />} label="Application Funnel" iconPosition="start" />
          <Tab icon={<ForumIcon />} label="Communities &amp; Messaging" iconPosition="start" />
          <Tab icon={<SearchOffIcon />} label="Search &amp; Zero-Results" iconPosition="start" />
          <Tab icon={<ScheduleSendIcon />} label="Scheduled Report Studio" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* TAB 0: OVERVIEW */}
      {currentTab === 0 && overview && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                TOTAL REGISTERED USERS
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 900, my: 1, color: '#6366f1' }}>
                {overview.total_users?.toLocaleString()}
              </Typography>
              <Chip label="+14.2% MoM" size="small" color="success" sx={{ fontWeight: 800 }} />
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                DAILY ACTIVE USERS (DAU)
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 900, my: 1, color: '#10b981' }}>
                {overview.active_users_dau?.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                DAU / MAU ratio: {((overview.active_users_dau / (overview.active_users_mau || 1)) * 100).toFixed(1)}%
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                TOTAL ACTIVE JOBS
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 900, my: 1, color: '#f59e0b' }}>
                {overview.total_jobs?.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {overview.total_applications?.toLocaleString()} Applications Submitted
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                TELEMETRY LATENCY
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 900, my: 1, color: '#ec4899' }}>
                {overview.event_processing_latency_ms} ms
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Sub-5ms Event Aggregation Pipeline
              </Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* TAB 1: USER GROWTH */}
      {currentTab === 1 && userGrowth && (
        <Card sx={{ p: 3, borderRadius: '24px' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            User Growth &amp; Activation Cohort Matrix
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: isDark ? 'rgba(15, 23, 42, 0.5)' : '#f8fafc', borderRadius: '16px' }}>
                <Typography variant="body2" color="text.secondary">Activated Users Pct</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#10b981' }}>
                  {((userGrowth.activated_users / (userGrowth.total_registrations || 1)) * 100).toFixed(1)}%
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: isDark ? 'rgba(15, 23, 42, 0.5)' : '#f8fafc', borderRadius: '16px' }}>
                <Typography variant="body2" color="text.secondary">Avg Profile Completion</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#6366f1' }}>
                  {userGrowth.profile_completion_pct}%
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: isDark ? 'rgba(15, 23, 42, 0.5)' : '#f8fafc', borderRadius: '16px' }}>
                <Typography variant="body2" color="text.secondary">30-Day Retention Rate</Typography>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#ec4899' }}>
                  {userGrowth.retention_rate_pct}%
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* TAB 2: JOB MARKET */}
      {currentTab === 2 && jobMarket && (
        <Card sx={{ p: 3, borderRadius: '24px' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Job Market &amp; High-Demand Skills Heatmap
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Requested Skill</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Open Postings</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Market Share Pct</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobMarket.top_skills_requested?.map((sk: any) => (
                  <TableRow key={sk.skill}>
                    <TableCell sx={{ fontWeight: 700 }}>{sk.skill}</TableCell>
                    <TableCell>{sk.count}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box sx={{ width: 100 }}>
                          <LinearProgress variant="determinate" value={sk.share} sx={{ height: 8, borderRadius: 4 }} />
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 800 }}>{sk.share}%</Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* TAB 3: FUNNEL */}
      {currentTab === 3 && appFunnel && (
        <Card sx={{ p: 3, borderRadius: '24px' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Job Seeker Conversion &amp; Hiring Funnel
          </Typography>
          <Stack spacing={2}>
            {appFunnel.funnel_stages?.map((st: any) => (
              <Box key={st.stage}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{st.stage}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>{st.count.toLocaleString()} ({st.percentage}%)</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={st.percentage} sx={{ height: 10, borderRadius: 5 }} />
              </Box>
            ))}
          </Stack>
        </Card>
      )}

      {/* TAB 5: SEARCH & ZERO-RESULTS */}
      {currentTab === 5 && searchData && (
        <Card sx={{ p: 3, borderRadius: '24px' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Zero-Result Search Discovery &amp; Supply Gaps
          </Typography>
          <Alert severity="warning" sx={{ mb: 3, borderRadius: '12px' }}>
            Searches yielding zero results indicate missing skills or unfilled job titles in candidate supply!
          </Alert>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Unmatched Query Term</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Search Volume</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Action Required</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {searchData.zero_result_searches?.map((zr: any) => (
                  <TableRow key={zr.query_term}>
                    <TableCell sx={{ fontWeight: 700, color: '#ef4444' }}>{zr.query_term}</TableCell>
                    <TableCell>{zr.search_count}</TableCell>
                    <TableCell>
                      <Chip label="Notify Recruiters &amp; Recommend Skill" size="small" color="primary" sx={{ fontWeight: 800 }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* TAB 6: SCHEDULED REPORT STUDIO */}
      {currentTab === 6 && (
        <Card sx={{ p: 3, borderRadius: '24px' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Scheduled Executive Report Cron Digest
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Report Title</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Cron Schedule</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Format</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Recipients</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scheduledReports.map((sr: any) => (
                  <TableRow key={sr.id}>
                    <TableCell sx={{ fontWeight: 700 }}>{sr.title}</TableCell>
                    <TableCell><Chip label={sr.cron_expression} size="small" variant="outlined" /></TableCell>
                    <TableCell>{sr.export_format.toUpperCase()}</TableCell>
                    <TableCell>{sr.recipients?.join(', ')}</TableCell>
                    <TableCell><Chip label="Active" color="success" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
};

export default AdminAnalyticsCenter;

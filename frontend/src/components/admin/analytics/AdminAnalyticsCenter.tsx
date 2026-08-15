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
import ForumIcon from '@mui/icons-material/Forum';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import ShieldIcon from '@mui/icons-material/Shield';
import AddIcon from '@mui/icons-material/Add';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

import analyticsApi from '../../../features/analytics/services/analyticsApi';
import PerformanceDashboard from '../../analytics/PerformanceDashboard';
import TrustSafetyAnalyticsCard from '../../analytics/TrustSafetyAnalyticsCard';
import UserConsentToggleModal from '../../analytics/UserConsentToggleModal';
import ScheduledReportDialog from '../../analytics/ScheduledReportDialog';

export const AdminAnalyticsCenter: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [currentTab, setCurrentTab] = useState(0);
  const [dateRange, setDateRange] = useState('30d');
  const [overview, setOverview] = useState<any>(null);
  const [userGrowth, setUserGrowth] = useState<any>(null);
  const [cohortData, setCohortData] = useState<any>(null);
  const [funnelData, setFunnelData] = useState<any>(null);
  const [jobMarket, setJobMarket] = useState<any>(null);
  const [appFunnel, setAppFunnel] = useState<any>(null);
  const [messaging, setMessaging] = useState<any>(null);
  const [searchData, setSearchData] = useState<any>(null);
  const [scheduledReports, setScheduledReports] = useState<any[]>([]);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Dialog states
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [cleanupNotice, setCleanupNotice] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, [dateRange]);

  const loadAllData = async () => {
    const [ov, ug, ch, fn, jm, af, ms, sr, rep] = await Promise.all([
      analyticsApi.getAdminOverview(),
      analyticsApi.getAdminUserGrowth(),
      analyticsApi.getCohortGrid(),
      analyticsApi.getActivationFunnel(),
      analyticsApi.getAdminJobMarket(),
      analyticsApi.getAdminApplicationFunnel(),
      analyticsApi.getAdminMessaging(),
      analyticsApi.getAdminSearch(),
      analyticsApi.getScheduledReports(),
    ]);

    setOverview(ov);
    setUserGrowth(ug);
    setCohortData(ch);
    setFunnelData(fn);
    setJobMarket(jm);
    setAppFunnel(af);
    setMessaging(ms);
    setSearchData(sr);
    setScheduledReports(rep);
  };

  const handleTriggerExport = async (format: string) => {
    const res = await analyticsApi.requestExport(format);
    setExportNotice(`Export job #${res.export.id} queued successfully! Format: ${format.toUpperCase()}`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  const handleRunCleanup = async () => {
    const res = await analyticsApi.triggerRetentionCleanup(90);
    setCleanupNotice(`${res.message} (${res.deleted_records} obsolete records purged).`);
    setTimeout(() => setCleanupNotice(null), 5000);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
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
            Export CSV
          </Button>
        </Stack>
      </Stack>

      {exportNotice && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>
          {exportNotice}
        </Alert>
      )}

      {cleanupNotice && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: '12px' }}>
          {cleanupNotice}
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
          <Tab icon={<TrendingUpIcon />} label="User Activation &amp; Cohorts" iconPosition="start" />
          <Tab icon={<WorkIcon />} label="Job Market &amp; Skills" iconPosition="start" />
          <Tab icon={<FilterAltIcon />} label="Application Funnel" iconPosition="start" />
          <Tab icon={<SpeedIcon />} label="Performance Telemetry" iconPosition="start" />
          <Tab icon={<SecurityIcon />} label="Trust &amp; Safety" iconPosition="start" />
          <Tab icon={<ForumIcon />} label="Communities &amp; Messaging" iconPosition="start" />
          <Tab icon={<SearchOffIcon />} label="Search &amp; Zero-Results" iconPosition="start" />
          <Tab icon={<ScheduleSendIcon />} label="Scheduled Reports" iconPosition="start" />
          <Tab icon={<ShieldIcon />} label="Privacy &amp; Retention" iconPosition="start" />
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

      {/* TAB 1: USER ACTIVATION & COHORTS */}
      {currentTab === 1 && (
        <Stack spacing={3}>
          {userGrowth && (
            <Card sx={{ p: 3, borderRadius: '24px' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                User Growth &amp; Activation Cohort Summary
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

          {/* Activation Funnel Stages */}
          {funnelData && (
            <Card sx={{ p: 3, borderRadius: '24px' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                User Onboarding &amp; Activation Funnel
              </Typography>
              <Stack spacing={2}>
                {funnelData.stages?.map((stg: any) => (
                  <Box key={stg.stage_name}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{stg.stage_name}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        {stg.count?.toLocaleString()} ({stg.conversion_pct}%)
                      </Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={stg.conversion_pct} sx={{ height: 10, borderRadius: 5 }} />
                  </Box>
                ))}
              </Stack>
            </Card>
          )}

          {/* Retention Cohort Grid */}
          {cohortData && (
            <Card sx={{ p: 3, borderRadius: '24px' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Weekly User Retention Matrix (Cohort Analysis)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Cohort</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Size</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>W0</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>W1</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>W2</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>W3</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>W4</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cohortData.cohorts?.map((c: any) => (
                      <TableRow key={c.cohort_name}>
                        <TableCell sx={{ fontWeight: 700 }}>{c.cohort_name}</TableCell>
                        <TableCell>{c.cohort_date}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{c.initial_users}</TableCell>
                        {c.retention_percentages?.map((pct: number, idx: number) => (
                          <TableCell key={idx} sx={{ fontWeight: 800, color: pct > 70 ? '#10b981' : pct > 0 ? '#3b82f6' : 'text.disabled' }}>
                            {pct > 0 ? `${pct}%` : '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
        </Stack>
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

      {/* TAB 3: APPLICATION FUNNEL */}
      {currentTab === 3 && appFunnel && (
        <Card sx={{ p: 3, borderRadius: '24px' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Job Seeker Conversion &amp; Hiring Funnel
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={2}>
              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
                <Typography variant="caption" color="text.secondary">Views</Typography>
                <Typography variant="h5" fontWeight={900}>{appFunnel.total_views?.toLocaleString()}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
                <Typography variant="caption" color="text.secondary">Saves</Typography>
                <Typography variant="h5" fontWeight={900}>{appFunnel.total_saves?.toLocaleString()}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
                <Typography variant="caption" color="text.secondary">Applications</Typography>
                <Typography variant="h5" fontWeight={900} color="primary.main">{appFunnel.total_applications?.toLocaleString()}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
                <Typography variant="caption" color="text.secondary">Interviews</Typography>
                <Typography variant="h5" fontWeight={900} color="info.main">{appFunnel.total_interviews?.toLocaleString()}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
                <Typography variant="caption" color="text.secondary">Offers</Typography>
                <Typography variant="h5" fontWeight={900} color="warning.main">{appFunnel.total_offers?.toLocaleString()}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
                <Typography variant="caption" color="text.secondary">Hires</Typography>
                <Typography variant="h5" fontWeight={900} color="success.main">{appFunnel.total_hires?.toLocaleString()}</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* TAB 4: PERFORMANCE TELEMETRY */}
      {currentTab === 4 && <PerformanceDashboard />}

      {/* TAB 5: TRUST & SAFETY */}
      {currentTab === 5 && <TrustSafetyAnalyticsCard />}

      {/* TAB 6: COMMUNITIES & MESSAGING */}
      {currentTab === 6 && messaging && (
        <Card sx={{ p: 3, borderRadius: '24px' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Messaging &amp; Network Interaction Telemetry
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, borderRadius: 3 }}>
                <Typography variant="caption" color="text.secondary">Total Conversations</Typography>
                <Typography variant="h4" fontWeight={900}>{messaging.total_conversations?.toLocaleString()}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, borderRadius: 3 }}>
                <Typography variant="caption" color="text.secondary">Messages Sent</Typography>
                <Typography variant="h4" fontWeight={900} color="primary">{messaging.total_messages_sent?.toLocaleString()}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, borderRadius: 3 }}>
                <Typography variant="caption" color="text.secondary">Delivery Success Rate</Typography>
                <Typography variant="h4" fontWeight={900} color="success.main">{messaging.delivery_success_rate_pct}%</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, borderRadius: 3 }}>
                <Typography variant="caption" color="text.secondary">Avg Response Time</Typography>
                <Typography variant="h4" fontWeight={900} color="info.main">{messaging.avg_response_time_mins} mins</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* TAB 7: SEARCH & ZERO-RESULTS */}
      {currentTab === 7 && searchData && (
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

      {/* TAB 8: SCHEDULED REPORTS */}
      {currentTab === 8 && (
        <Card sx={{ p: 3, borderRadius: '24px' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Scheduled Executive Report Cron Studio
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setScheduleDialogOpen(true)}
              sx={{ borderRadius: 3, fontWeight: 800 }}
            >
              Schedule New Report
            </Button>
          </Stack>
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
                    <TableCell>{sr.export_format?.toUpperCase()}</TableCell>
                    <TableCell>{sr.recipients?.join(', ')}</TableCell>
                    <TableCell><Chip label="Active" color="success" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* TAB 9: PRIVACY & RETENTION */}
      {currentTab === 9 && (
        <Card sx={{ p: 3, borderRadius: '24px' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Privacy Consent &amp; Telemetry Retention Controls
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="subtitle1" fontWeight={800} gutterBottom>
                  Privacy Preferences Controls
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Configure system-wide user consent defaults and optional telemetry tracking settings.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<ShieldIcon />}
                  onClick={() => setConsentModalOpen(true)}
                  sx={{ borderRadius: 3, fontWeight: 800 }}
                >
                  Configure Consent Modal
                </Button>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="subtitle1" fontWeight={800} gutterBottom color="error.main">
                  Data Retention &amp; Automated Cleanup
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Trigger an immediate cleanup run to purge expired analytics event records older than 90 days.
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteSweepIcon />}
                  onClick={handleRunCleanup}
                  sx={{ borderRadius: 3, fontWeight: 800 }}
                >
                  Trigger Retention Cleanup
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* Modals & Dialogs */}
      <ScheduledReportDialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        onCreated={(newRep) => setScheduledReports((prev) => [...prev, newRep])}
      />

      <UserConsentToggleModal
        open={consentModalOpen}
        onClose={() => setConsentModalOpen(false)}
      />
    </Box>
  );
};

export default AdminAnalyticsCenter;

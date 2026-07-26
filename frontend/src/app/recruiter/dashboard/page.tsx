'use client';

import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  Chip,
  IconButton,
  Tabs,
  Tab,
  Divider,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import BarChartIcon from '@mui/icons-material/BarChart';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import SearchIcon from '@mui/icons-material/Search';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';

import { useColorMode } from '../../providers';
import { recruiterApi } from '../../../features/recruiter/services/recruiterApi';

// Type declarations
interface RecruiterJob {
  id: string;
  title: string;
  department: string;
  location: string;
  salaryRange: string;
  status: string;
}

interface Candidate {
  id: string;
  jobId: string;
  candidateName: string;
  candidateEmail: string;
  stage: 'Applied' | 'Screening' | 'Shortlisted' | 'Interview' | 'Selected' | 'Rejected';
  notes: string;
  interviewScheduledAt?: string;
}

interface RecruiterActivity {
  id: string;
  activityType: string;
  description: string;
  createdAt: string;
}

const STAGES = ['Applied', 'Screening', 'Shortlisted', 'Interview', 'Selected', 'Rejected'] as const;

export default function RecruiterDashboardPage() {
  const { mode, toggleColorMode } = useColorMode();

  // States
  const [jobs, setJobs] = useState<RecruiterJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activities, setActivities] = useState<RecruiterActivity[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  // Search & Bookmark states
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
  const [savedCandidates, setSavedCandidates] = useState<Candidate[]>([
    { id: 'cand-saved-1', jobId: 'job-1', candidateName: 'Sarah Al-Said', candidateEmail: 'sarah.s@kirmya.ae', stage: 'Screening', notes: 'Saved for future roles review.' },
  ]);

  const candidateCatalog: Candidate[] = [
    { id: 'cand-1', jobId: 'job-1', candidateName: 'Salim Al-Harthy', candidateEmail: 'salim.h@kirmya.ae', stage: 'Applied', notes: 'Go monolith backend developer.' },
    { id: 'cand-2', jobId: 'job-1', candidateName: 'Sarah Al-Said', candidateEmail: 'sarah.s@kirmya.ae', stage: 'Screening', notes: 'Docker, Redis, compose pipelines.' },
    { id: 'cand-3', jobId: 'job-1', candidateName: 'Fatima Al-Kamali', candidateEmail: 'fatima.k@kirmya.ae', stage: 'Shortlisted', notes: 'Next.js, MUI layout engineer.' },
    { id: 'cand-4', jobId: 'job-1', candidateName: 'Tariq Al-Balushi', candidateEmail: 'tariq.b@kirmya.ae', stage: 'Interview', notes: 'Distributed systems architect.' },
    { id: 'cand-extra-1', jobId: 'job-1', candidateName: 'Ayesha Siddiqui', candidateEmail: 'ayesha.s@kirmya.ae', stage: 'Applied', notes: 'FCM push notifications implementation.' },
    { id: 'cand-extra-2', jobId: 'job-2', candidateName: 'Zaid Al-Habsi', candidateEmail: 'zaid.h@kirmya.ae', stage: 'Screening', notes: 'JWT access token rotation logic.' }
  ];

  const handleSaveCandidate = (c: Candidate) => {
    if (savedCandidates.some(saved => saved.id === c.id)) return;
    setSavedCandidates(prev => [...prev, c]);
    setActivities(prev => [
      { id: Math.random().toString(), activityType: 'candidate_saved', description: `Saved candidate ${c.candidateName} for review`, createdAt: 'Just now' },
      ...prev
    ]);
  };

  const handleRemoveSavedCandidate = (id: string) => {
    setSavedCandidates(prev => prev.filter(c => c.id !== id));
  };

  // Job Posting Dialog Form
  const [openPostJob, setOpenPostJob] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDept, setJobDept] = useState('Engineering');
  const [jobLoc, setJobLoc] = useState('Dubai, UAE');
  const [jobSalary, setJobSalary] = useState('AED 20,000 - 30,000');
  const [jobDesc, setJobDesc] = useState('');
  const [postingJob, setPostingJob] = useState(false);

  // Interview Schedule Dialog Form
  const [openSchedule, setOpenSchedule] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [interviewTime, setInterviewTime] = useState('2026-07-26T14:00');
  const [interviewNotes, setInterviewNotes] = useState('');
  const [scheduling, setScheduling] = useState(false);

  // Set Title
  useEffect(() => {
    document.title = "Kirmya - Recruiter Administration Console";
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const profile = await recruiterApi.getProfile();
      const jobList = await recruiterApi.getJobs();
      setJobs(jobList || []);
      
      if (jobList && jobList.length > 0) {
        const firstJobId = jobList[0].id;
        setSelectedJobId(firstJobId);
        const pipeline = await recruiterApi.getPipeline(firstJobId);
        setCandidates(pipeline || []);
      }

      const analytics = await recruiterApi.getAnalytics();
      setActivities(analytics.recentActivities || []);
    } catch (err) {
      console.warn('Backend server unreachable. Bootstrapping recruiter sandbox simulator.');
      setIsSandboxMode(true);

      // Preloaded sandbox jobs
      const mockJobs: RecruiterJob[] = [
        { id: 'job-1', title: 'Senior Software Engineer (Go)', department: 'Engineering', location: 'Dubai, UAE', salaryRange: 'AED 25,000 - 35,000', status: 'active' },
        { id: 'job-2', title: 'Lead DevOps Architect', department: 'Infrastructure', location: 'Abu Dhabi, UAE', salaryRange: 'AED 30,000 - 42,000', status: 'active' },
      ];
      setJobs(mockJobs);
      setSelectedJobId('job-1');

      // Preloaded candidates matching job-1
      setCandidates([
        { id: 'cand-1', jobId: 'job-1', candidateName: 'Salim Al-Harthy', candidateEmail: 'salim.h@kirmya.ae', stage: 'Applied', notes: 'Solid understanding of backend microservices.' },
        { id: 'cand-2', jobId: 'job-1', candidateName: 'Sarah Al-Said', candidateEmail: 'sarah.s@kirmya.ae', stage: 'Screening', notes: 'Experienced with Docker and staging integrations.' },
        { id: 'cand-3', jobId: 'job-1', candidateName: 'Fatima Al-Kamali', candidateEmail: 'fatima.k@kirmya.ae', stage: 'Shortlisted', notes: 'Highly recommended in technical reviews.' },
        { id: 'cand-4', jobId: 'job-1', candidateName: 'Tariq Al-Balushi', candidateEmail: 'tariq.b@kirmya.ae', stage: 'Interview', notes: 'System design scheduling interview.', interviewScheduledAt: '2026-07-27T10:00:00Z' },
      ]);

      setActivities([
        { id: 'act-1', activityType: 'job_created', description: 'Posted Senior Software Engineer (Go) listing', createdAt: '3 mins ago' },
        { id: 'act-2', activityType: 'stage_updated', description: 'Advanced Sarah Al-Said to Screening stage', createdAt: '10 mins ago' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update pipeline when selected job changes
  useEffect(() => {
    if (!selectedJobId || loading) return;

    const fetchPipeline = async () => {
      try {
        if (isSandboxMode) {
          // Simulator candidate generation for job-2
          if (selectedJobId === 'job-2') {
            setCandidates([
              { id: 'cand-5', jobId: 'job-2', candidateName: 'Yousuf Al-Busaidi', candidateEmail: 'yousuf.b@kirmya.ae', stage: 'Applied', notes: 'Strong Kubernetes credentials.' },
              { id: 'cand-6', jobId: 'job-2', candidateName: 'Laila Al-Ghafri', candidateEmail: 'laila.g@kirmya.ae', stage: 'Interview', notes: 'Live coding scheduled.', interviewScheduledAt: '2026-07-28T14:30:00Z' },
            ]);
          } else {
            setCandidates([
              { id: 'cand-1', jobId: 'job-1', candidateName: 'Salim Al-Harthy', candidateEmail: 'salim.h@kirmya.ae', stage: 'Applied', notes: 'Solid understanding of backend microservices.' },
              { id: 'cand-2', jobId: 'job-1', candidateName: 'Sarah Al-Said', candidateEmail: 'sarah.s@kirmya.ae', stage: 'Screening', notes: 'Experienced with Docker and staging integrations.' },
              { id: 'cand-3', jobId: 'job-1', candidateName: 'Fatima Al-Kamali', candidateEmail: 'fatima.k@kirmya.ae', stage: 'Shortlisted', notes: 'Highly recommended in technical reviews.' },
              { id: 'cand-4', jobId: 'job-1', candidateName: 'Tariq Al-Balushi', candidateEmail: 'tariq.b@kirmya.ae', stage: 'Interview', notes: 'System design scheduling interview.', interviewScheduledAt: '2026-07-27T10:00:00Z' },
            ]);
          }
        } else {
          const list = await recruiterApi.getPipeline(selectedJobId);
          setCandidates(list || []);
        }
      } catch (err) {
        // Fallback checks
      }
    };
    fetchPipeline();
  }, [selectedJobId]);

  // Transition Candidate Pipeline Stage
  const handleMoveStage = async (candidateId: string, nextStage: Candidate['stage']) => {
    // Check if moving to Interview and needs schedule time
    if (nextStage === 'Interview') {
      const cand = candidates.find(c => c.id === candidateId);
      if (cand) {
        setSelectedCandidate(cand);
        setOpenSchedule(true);
        return;
      }
    }

    setCandidates(prev => 
      prev.map(c => c.id === candidateId ? { ...c, stage: nextStage } : c)
    );

    // Add activity log locally
    const candName = candidates.find(c => c.id === candidateId)?.candidateName || 'Candidate';
    const actMsg = `Moved ${candName} to ${nextStage} stage`;
    setActivities(prev => [
      { id: Math.random().toString(), activityType: 'stage_updated', description: actMsg, createdAt: 'Just now' },
      ...prev
    ]);

    try {
      if (!isSandboxMode) {
        await recruiterApi.updatePipelineStage(candidateId, { stage: nextStage });
      }
    } catch (err) {
      // Ignored on offline
    }
  };

  // Schedule Interview Submit
  const handleScheduleSubmit = async () => {
    if (!selectedCandidate) return;
    setScheduling(true);

    try {
      const timeString = new Date(interviewTime).toISOString();
      
      setCandidates(prev => 
        prev.map(c => c.id === selectedCandidate.id ? { 
          ...c, 
          stage: 'Interview', 
          interviewScheduledAt: timeString,
          notes: interviewNotes || c.notes 
        } : c)
      );

      const actMsg = `Scheduled interview for ${selectedCandidate.candidateName} on ${new Date(interviewTime).toLocaleDateString()}`;
      setActivities(prev => [
        { id: Math.random().toString(), activityType: 'interview_scheduled', description: actMsg, createdAt: 'Just now' },
        ...prev
      ]);

      if (!isSandboxMode) {
        await recruiterApi.updatePipelineStage(selectedCandidate.id, {
          stage: 'Interview',
          notes: interviewNotes,
          interviewScheduledAt: timeString,
        });
      }

      setOpenSchedule(false);
      setSelectedCandidate(null);
    } catch (err) {
      // Failed stubs
    } finally {
      setScheduling(false);
    }
  };

  // Create Job Submit
  const handlePostJobSubmit = async () => {
    if (!jobTitle.trim() || !jobDesc.trim()) return;
    setPostingJob(true);

    const payload = {
      title: jobTitle,
      description: jobDesc,
      department: jobDept,
      location: jobLoc,
      salaryRange: jobSalary,
    };

    try {
      if (isSandboxMode) {
        const newJob: RecruiterJob = {
          id: `job-${Date.now()}`,
          ...payload,
          status: 'active',
        };
        setJobs(prev => [newJob, ...prev]);
        setSelectedJobId(newJob.id);
        setCandidates([]); // Initialize with empty pipeline candidates
        setOpenPostJob(false);
      } else {
        const created = await recruiterApi.createJob(payload);
        setJobs(prev => [created, ...prev]);
        setSelectedJobId(created.id);
        setOpenPostJob(false);
      }

      const actMsg = `Posted a new job: ${jobTitle}`;
      setActivities(prev => [
        { id: Math.random().toString(), activityType: 'job_created', description: actMsg, createdAt: 'Just now' },
        ...prev
      ]);

      // Reset
      setJobTitle('');
      setJobDesc('');
    } catch (err) {
      // Failed stubs
    } finally {
      setPostingJob(false);
    }
  };

  // SVG Chart rendering helper
  const renderPipelineDistributionChart = () => {
    // Count candidates in each stage
    const counts = STAGES.reduce((acc, stage) => {
      acc[stage] = candidates.filter(c => c.stage === stage).length;
      return acc;
    }, {} as Record<string, number>);

    const width = 500;
    const height = 180;
    const paddingLeft = 60;
    const paddingRight = 10;
    const paddingTop = 20;
    const paddingBottom = 20;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const maxVal = Math.max(...Object.values(counts), 1) * 1.1;

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
        {STAGES.map((stage, idx) => {
          const groupWidth = chartWidth / STAGES.length;
          const barWidth = groupWidth * 0.6;
          const startX = paddingLeft + idx * groupWidth + groupWidth * 0.2;

          const count = counts[stage] || 0;
          const barHeight = (count / maxVal) * chartHeight;
          const barY = paddingTop + chartHeight - barHeight;

          // Color palette mapped by stage
          let barColor = '#64748b'; // gray
          if (stage === 'Applied') barColor = '#0a66c2'; // blue
          if (stage === 'Screening') barColor = '#6366f1'; // indigo
          if (stage === 'Shortlisted') barColor = '#f59e0b'; // amber
          if (stage === 'Interview') barColor = '#8b5cf6'; // purple
          if (stage === 'Selected') barColor = '#10b981'; // emerald
          if (stage === 'Rejected') barColor = '#ef4444'; // red

          return (
            <g key={idx}>
              <rect
                x={startX}
                y={barY}
                width={barWidth}
                height={barHeight}
                fill={barColor}
                rx="2"
              />
              {/* Value Label */}
              {count > 0 && (
                <text x={startX + barWidth/2} y={barY - 4} fill={mode === 'light' ? '#1f2937' : '#f9fafb'} fontSize="9" fontWeight="800" textAnchor="middle">
                  {count}
                </text>
              )}
              {/* X Axis Label */}
              <text x={startX + barWidth/2} y={height - 2} fill={mode === 'light' ? '#64748b' : '#94a3b8'} fontSize="8" fontWeight="700" textAnchor="middle">
                {stage}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // Scheduler Interview list
  const interviewCandidates = candidates.filter(c => c.stage === 'Interview' && c.interviewScheduledAt);

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
              Kirmya Recruiter Administration Portal
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Recruitment Center & Candidate Management
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          {isSandboxMode && (
            <Chip
              label="SANDBOX MODE (OFFLINE)"
              color="error"
              size="small"
              sx={{ fontWeight: 700, fontSize: '0.7rem' }}
            />
          )}
          <Button
            variant="contained"
            size="small"
            startIcon={<WorkOutlineIcon />}
            onClick={() => setOpenPostJob(true)}
            sx={{ textTransform: 'none', fontWeight: 700, bgcolor: '#0a66c2', '&:hover': { bgcolor: '#004182' } }}
          >
            Post Job
          </Button>
          <IconButton onClick={toggleColorMode} sx={{ color: 'text.secondary' }}>
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Stack>
      </Box>

      {/* Main Console Workspace */}
      <Container component="main" maxWidth="lg" sx={{ flexGrow: 1, py: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress size={40} />
          </Box>
        ) : (
          <Grid container spacing={3.5}>
            
            {/* Left Nav Tabs Column */}
            <Grid item xs={12} md={3}>
              <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none', borderRadius: 2 }}>
                <CardContent sx={{ p: 1 }}>
                  <Tabs
                    orientation="vertical"
                    value={activeTab}
                    onChange={(e, val) => setActiveTab(val)}
                    sx={{
                      '& .MuiTab-root': {
                        alignItems: 'flex-start',
                        textTransform: 'none',
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        py: 1.5,
                        px: 2,
                        borderRadius: 1.5,
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      },
                      '& .Mui-selected': {
                        color: '#0a66c2 !important',
                        bgcolor: 'rgba(10, 102, 194, 0.05)',
                      },
                      '& .MuiTabs-indicator': {
                        left: 0,
                        width: '4px',
                        bgcolor: '#0a66c2',
                      },
                    }}
                  >
                    <Tab label="Dashboard Overview" icon={<DashboardIcon sx={{ fontSize: '1.2rem', mr: 1 }} />} iconPosition="start" />
                    <Tab label="Active Job Posts" icon={<WorkOutlineIcon sx={{ fontSize: '1.2rem', mr: 1 }} />} iconPosition="start" />
                    <Tab label="Candidate Pipeline" icon={<AssignmentIndIcon sx={{ fontSize: '1.2rem', mr: 1 }} />} iconPosition="start" />
                    <Tab label="Candidate Search" icon={<SearchIcon sx={{ fontSize: '1.2rem', mr: 1 }} />} iconPosition="start" />
                    <Tab label="Saved Candidates" icon={<StarBorderIcon sx={{ fontSize: '1.2rem', mr: 1 }} />} iconPosition="start" />
                    <Tab label="Interview Scheduler" icon={<CalendarMonthIcon sx={{ fontSize: '1.2rem', mr: 1 }} />} iconPosition="start" />
                    <Tab label="Recruiter Analytics" icon={<BarChartIcon sx={{ fontSize: '1.2rem', mr: 1 }} />} iconPosition="start" />
                  </Tabs>
                </CardContent>
              </Card>

              {/* Job selector dropdown (shared among tabs) */}
              {jobs.length > 0 && (
                <FormControl fullWidth size="small" sx={{ mt: 3 }}>
                  <InputLabel id="job-select-label">Active Job Scope</InputLabel>
                  <Select
                    labelId="job-select-label"
                    value={selectedJobId}
                    label="Active Job Scope"
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    sx={{ bgcolor: mode === 'light' ? 'white' : '#111827' }}
                  >
                    {jobs.map(j => (
                      <MenuItem key={j.id} value={j.id}>{j.title}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Grid>

            {/* Right Display Area */}
            <Grid item xs={12} md={9}>
              {/* Tab 0: Overview */}
              {activeTab === 0 && (
                <Stack spacing={3}>
                  {/* Stats Cards grid */}
                  <Grid container spacing={3}>
                    <Grid item xs={6} sm={3}>
                      <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none' }}>
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>ACTIVE JOBS</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>{jobs.length}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none' }}>
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>TOTAL CANDIDATES</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>{candidates.length}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none' }}>
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>IN SCREENING</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>
                            {candidates.filter(c => c.stage === 'Screening').length}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none' }}>
                        <CardContent sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>INTERVIEWS</Typography>
                          <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>
                            {candidates.filter(c => c.stage === 'Interview').length}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  {/* Audit activity list */}
                  <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 850, mb: 2 }}>
                        Recent Recruiter Actions
                      </Typography>
                      <List sx={{ p: 0 }}>
                        {activities.map((act) => (
                          <React.Fragment key={act.id}>
                            <ListItem sx={{ px: 0, py: 1.5 }}>
                              <ListItemIcon sx={{ minWidth: 32, color: '#0a66c2' }}>
                                <CheckCircleIcon sx={{ fontSize: '1.2rem' }} />
                              </ListItemIcon>
                              <ListItemText
                                primary={<Typography variant="caption" sx={{ fontWeight: 750, color: mode === 'light' ? '#1f2937' : '#f3f4f6' }}>{act.description}</Typography>}
                                secondary={<Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{act.createdAt}</Typography>}
                              />
                            </ListItem>
                            <Divider />
                          </React.Fragment>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Stack>
              )}

              {/* Tab 1: Job Postings */}
              {activeTab === 1 && (
                <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none' }}>
                  <CardContent sx={{ p: 3.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 850, mb: 2.5 }}>
                      Active Job Positions
                    </Typography>
                    <List sx={{ p: 0 }}>
                      {jobs.map((j) => (
                        <React.Fragment key={j.id}>
                          <ListItem
                            sx={{ px: 0, py: 2 }}
                            secondaryAction={
                              <Chip label={j.status.toUpperCase()} color="success" variant="outlined" size="small" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />
                            }
                          >
                            <ListItemIcon sx={{ minWidth: 36, color: '#0a66c2' }}>
                              <WorkOutlineIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary={<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{j.title}</Typography>}
                              secondary={<Typography variant="caption" color="text.secondary">{j.department} • {j.location} • {j.salaryRange}</Typography>}
                            />
                          </ListItem>
                          <Divider />
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              )}

              {/* Tab 2: Kanban Candidate Pipeline */}
              {activeTab === 2 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 850, mb: 2 }}>
                    Pipeline Kanban Manager
                  </Typography>

                  {/* Horizontal Scroll Columns Grid */}
                  <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, minHeight: '400px' }}>
                    {STAGES.map(stage => {
                      const stageCands = candidates.filter(c => c.stage === stage);
                      
                      // Headers color indicators
                      let headerColor = '#64748b';
                      if (stage === 'Applied') headerColor = '#0a66c2';
                      if (stage === 'Screening') headerColor = '#6366f1';
                      if (stage === 'Shortlisted') headerColor = '#f59e0b';
                      if (stage === 'Interview') headerColor = '#8b5cf6';
                      if (stage === 'Selected') headerColor = '#10b981';
                      if (stage === 'Rejected') headerColor = '#ef4444';

                      return (
                        <Box key={stage} sx={{ minWidth: '220px', maxWidth: '220px', flexGrow: 1 }}>
                          <Paper sx={{ p: 1.5, height: '100%', bgcolor: mode === 'light' ? '#f8fafc' : '#1e293b', borderTop: '4px solid', borderColor: headerColor, borderRadius: 2 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, px: 0.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 850, color: mode === 'light' ? '#1e293b' : '#f9fafb' }}>
                                {stage}
                              </Typography>
                              <Chip label={stageCands.length} size="small" sx={{ fontWeight: 800, fontSize: '0.65rem', height: 18 }} />
                            </Stack>

                            <Stack spacing={1.5}>
                              {stageCands.map(c => (
                                <Card key={c.id} sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', borderRadius: 1.5 }}>
                                  <CardContent sx={{ p: 1.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, mb: 0.25 }}>
                                      {c.candidateName}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', mb: 1 }}>
                                      {c.candidateEmail}
                                    </Typography>

                                    {c.notes && (
                                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', fontStyle: 'italic', mb: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        "{c.notes}"
                                      </Typography>
                                    )}

                                    {c.interviewScheduledAt && (
                                      <Chip
                                        icon={<CalendarMonthIcon sx={{ fontSize: '0.75rem !important' }} />}
                                        label={new Date(c.interviewScheduledAt).toLocaleDateString()}
                                        size="small"
                                        color="secondary"
                                        variant="outlined"
                                        sx={{ fontSize: '0.6rem', height: 18, mb: 1.5 }}
                                      />
                                    )}

                                    {/* Action controller buttons */}
                                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                      {stage !== 'Rejected' && stage !== 'Selected' && (
                                        <IconButton size="small" onClick={() => handleMoveStage(c.id, STAGES[STAGES.indexOf(stage) + 1])} color="primary" sx={{ p: 0.25 }}>
                                          <PlayArrowIcon sx={{ fontSize: '0.95rem' }} />
                                        </IconButton>
                                      )}
                                      {stage !== 'Rejected' && (
                                        <IconButton size="small" onClick={() => handleMoveStage(c.id, 'Rejected')} color="error" sx={{ p: 0.25 }}>
                                          <HighlightOffIcon sx={{ fontSize: '0.95rem' }} />
                                        </IconButton>
                                      )}
                                    </Stack>
                                  </CardContent>
                                </Card>
                              ))}
                            </Stack>
                          </Paper>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* Tab 3: Candidate Search */}
              {activeTab === 3 && (
                <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none' }}>
                  <CardContent sx={{ p: 3.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 850, mb: 2 }}>
                      Search Candidates Database
                    </Typography>
                    
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search candidates by name, email, skills..."
                      value={candidateSearchQuery}
                      onChange={(e) => setCandidateSearchQuery(e.target.value)}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />
                      }}
                      sx={{ mb: 3 }}
                    />

                    <List sx={{ p: 0 }}>
                      {candidateCatalog
                        .filter(c => 
                          c.candidateName.toLowerCase().includes(candidateSearchQuery.toLowerCase()) ||
                          c.notes.toLowerCase().includes(candidateSearchQuery.toLowerCase()) ||
                          c.candidateEmail.toLowerCase().includes(candidateSearchQuery.toLowerCase())
                        )
                        .map((c) => {
                          const isAlreadySaved = savedCandidates.some(s => s.id === c.id);
                          return (
                            <React.Fragment key={c.id}>
                              <ListItem
                                sx={{ px: 0, py: 2 }}
                                secondaryAction={
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={isAlreadySaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                                    onClick={() => handleSaveCandidate(c)}
                                    disabled={isAlreadySaved}
                                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
                                  >
                                    {isAlreadySaved ? 'Saved' : 'Save'}
                                  </Button>
                                }
                              >
                                <ListItemText
                                  primary={<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{c.candidateName}</Typography>}
                                  secondary={
                                    <Stack spacing={0.5}>
                                      <Typography variant="caption" color="text.secondary">{c.candidateEmail}</Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>"{c.notes}"</Typography>
                                    </Stack>
                                  }
                                />
                              </ListItem>
                              <Divider />
                            </React.Fragment>
                          );
                        })}
                    </List>
                  </CardContent>
                </Card>
              )}

              {/* Tab 4: Saved Candidates */}
              {activeTab === 4 && (
                <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none' }}>
                  <CardContent sx={{ p: 3.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 850, mb: 2.5 }}>
                      Saved Bookmarks List
                    </Typography>
                    {savedCandidates.length === 0 ? (
                      <Alert severity="info">No bookmarked candidate profiles. Use the search tab to find and bookmark talent.</Alert>
                    ) : (
                      <List sx={{ p: 0 }}>
                        {savedCandidates.map((c) => (
                          <React.Fragment key={c.id}>
                            <ListItem
                              sx={{ px: 0, py: 2 }}
                              secondaryAction={
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  onClick={() => handleRemoveSavedCandidate(c.id)}
                                  sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
                                >
                                  Remove
                                </Button>
                              }
                            >
                              <ListItemText
                                primary={<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{c.candidateName}</Typography>}
                                secondary={
                                  <Stack spacing={0.5}>
                                    <Typography variant="caption" color="text.secondary">{c.candidateEmail}</Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>"{c.notes}"</Typography>
                                  </Stack>
                                }
                              />
                            </ListItem>
                            <Divider />
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Tab 5: Interview Scheduler */}
              {activeTab === 5 && (
                <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none' }}>
                  <CardContent sx={{ p: 3.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 850, mb: 2.5 }}>
                      Scheduled Candidate Interviews
                    </Typography>
                    {interviewCandidates.length === 0 ? (
                      <Alert severity="info">No interviews currently scheduled. Transition candidates to 'Interview' to assign times.</Alert>
                    ) : (
                      <List sx={{ p: 0 }}>
                        {interviewCandidates.map((c) => (
                          <React.Fragment key={c.id}>
                            <ListItem sx={{ px: 0, py: 2 }}>
                              <ListItemIcon sx={{ minWidth: 36, color: '#8b5cf6' }}>
                                <CalendarMonthIcon />
                              </ListItemIcon>
                              <ListItemText
                                primary={<Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{c.candidateName}</Typography>}
                                secondary={
                                  <Typography variant="caption" color="text.secondary">
                                    Scheduled for: {new Date(c.interviewScheduledAt!).toLocaleString()} • Email: {c.candidateEmail}
                                  </Typography>
                                }
                              />
                            </ListItem>
                            <Divider />
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Tab 6: Recruiter Analytics */}
              {activeTab === 6 && (
                <Card sx={{ bgcolor: mode === 'light' ? 'white' : '#111827', border: mode === 'light' ? '1px solid #e0e0e0' : 'none' }}>
                  <CardContent sx={{ p: 3.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 850, mb: 3 }}>
                      Candidate Distribution by Pipeline Stage
                    </Typography>
                    <Box sx={{ height: 200, display: 'flex', alignItems: 'flex-end', pb: 2 }}>
                      {renderPipelineDistributionChart()}
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Grid>

          </Grid>
        )}
      </Container>

      {/* Post Job Dialog */}
      <Dialog open={openPostJob} onClose={() => setOpenPostJob(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Post a New Job Opportunity</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Job Position Title"
              placeholder="e.g. Senior Software Engineer (Go)"
              fullWidth
              size="small"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Department"
                  placeholder="e.g. Engineering"
                  fullWidth
                  size="small"
                  value={jobDept}
                  onChange={(e) => setJobDept(e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Location"
                  placeholder="e.g. Dubai, UAE"
                  fullWidth
                  size="small"
                  value={jobLoc}
                  onChange={(e) => setJobLoc(e.target.value)}
                />
              </Grid>
            </Grid>
            <TextField
              label="Salary Range Package"
              placeholder="e.g. AED 20,000 - 30,000"
              fullWidth
              size="small"
              value={jobSalary}
              onChange={(e) => setJobSalary(e.target.value)}
            />
            <TextField
              label="Detailed Job Description"
              multiline
              rows={4}
              fullWidth
              size="small"
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPostJob(false)} color="inherit" size="small" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handlePostJobSubmit}
            disabled={postingJob}
            variant="contained"
            size="small"
            sx={{ textTransform: 'none', bgcolor: '#0a66c2', '&:hover': { bgcolor: '#004182' } }}
          >
            {postingJob ? 'Posting...' : 'Post Job'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Interview Dialog */}
      <Dialog open={openSchedule} onClose={() => setOpenSchedule(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Schedule Interview</DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          {selectedCandidate && (
            <Stack spacing={2.5}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Candidate: {selectedCandidate.candidateName}
              </Typography>
              <TextField
                label="Date & Time"
                type="datetime-local"
                fullWidth
                size="small"
                value={interviewTime}
                onChange={(e) => setInterviewTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Interview notes / focus area"
                placeholder="e.g. System design interview, code review"
                multiline
                rows={2}
                fullWidth
                size="small"
                value={interviewNotes}
                onChange={(e) => setInterviewNotes(e.target.value)}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSchedule(false)} color="inherit" size="small" sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleScheduleSubmit}
            disabled={scheduling}
            variant="contained"
            size="small"
            sx={{ textTransform: 'none', bgcolor: '#0a66c2', '&:hover': { bgcolor: '#004182' } }}
          >
            {scheduling ? 'Scheduling...' : 'Confirm Schedule'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

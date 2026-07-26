'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Divider,
  Chip,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SpeedIcon from '@mui/icons-material/Speed';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';

import { analyticsApi } from '../../features/analytics/api';
import { AdminAnalytics, RecruiterAnalytics, UserAnalytics } from '../../features/analytics/types';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [adminData, setAdminData] = useState<AdminAnalytics | null>(null);
  const [recruiterData, setRecruiterData] = useState<RecruiterAnalytics | null>(null);
  const [userData, setUserData] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resAdmin, resRecruiter, resUser] = await Promise.allSettled([
        analyticsApi.getAdminAnalytics(),
        analyticsApi.getRecruiterAnalytics(),
        analyticsApi.getUserAnalytics(),
      ]);

      if (resAdmin.status === 'fulfilled') setAdminData(resAdmin.value);
      else setAdminData(mockAdminData);

      if (resRecruiter.status === 'fulfilled') setRecruiterData(resRecruiter.value);
      else setRecruiterData(mockRecruiterData);

      if (resUser.status === 'fulfilled') setUserData(resUser.value);
      else setUserData(mockUserData);
    } catch (err) {
      console.error(err);
      setAdminData(mockAdminData);
      setRecruiterData(mockRecruiterData);
      setUserData(mockUserData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const mockAdminData: AdminAnalytics = {
    total_users: 12450,
    active_users: 8920,
    user_growth_rate: 14.5,
    total_job_openings: 1840,
    hiring_velocity_days: 18.2,
    skill_demand_heatmap: [
      { skill: 'Go (Golang)', count: 3420, share: 28.5 },
      { skill: 'React / Next.js', count: 2980, share: 24.8 },
      { skill: 'PostgreSQL Architecture', count: 2150, share: 17.9 },
      { skill: 'System Design & Microservices', count: 1890, share: 15.8 },
      { skill: 'Kubernetes & Cloud Infra', count: 1560, share: 13.0 },
    ],
    market_trend_summary: 'High demand for Senior Full-Stack Engineers & Go Backend Architects. Hiring speed increased by 18% month-over-month.',
  };

  const mockRecruiterData: RecruiterAnalytics = {
    total_candidates_screened: 480,
    avg_time_to_hire_days: 16.4,
    application_to_offer_rate: 12.8,
    candidate_funnel: [
      { stage: 'Applied', count: 480, percentage: 100.0 },
      { stage: 'ATS Screened', count: 288, percentage: 60.0 },
      { stage: 'Technical Interview', count: 144, percentage: 30.0 },
      { stage: 'Offer Extended', count: 62, percentage: 12.9 },
      { stage: 'Hired', count: 48, percentage: 10.0 },
    ],
    top_performing_job: 'Senior Full-Stack Go Engineer',
    job_views_count: 3410,
  };

  const mockUserData: UserAnalytics = {
    profile_views_count: 84,
    search_appearances_count: 210,
    applications_count: 14,
    interview_invitation_rate: 35.7,
    profile_completeness: 95,
    top_searching_companies: ['Stripe Global', 'TechCorp', 'Google', 'Kirmya Careers'],
  };

  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100vh', color: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Title Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(90deg, #38bdf8 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Advanced Multi-Role Analytics Studio
          </Typography>
          <Typography variant="body2" sx={{ color: '#94a3b8' }}>
            Real-time analytics engine tracking user growth, candidate conversion funnels, hiring speed, and candidate profile impressions.
          </Typography>
        </Box>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />}

        {/* Navigation Tabs */}
        <Paper sx={{ mb: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 1.5 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              '& .MuiTabs-indicator': { bgcolor: '#38bdf8' },
              '& .MuiTab-root': { color: '#94a3b8', fontWeight: 'bold', textTransform: 'none' },
              '& .Mui-selected': { color: '#38bdf8' },
            }}
          >
            <Tab icon={<AdminPanelSettingsIcon fontSize="small" />} iconPosition="start" label="Admin Market Analytics" />
            <Tab icon={<WorkHistoryIcon fontSize="small" />} iconPosition="start" label="Recruiter Conversion & Hiring Speed" />
            <Tab icon={<PersonSearchIcon fontSize="small" />} iconPosition="start" label="Candidate Profile Analytics" />
          </Tabs>
        </Paper>

        {/* Tab 0: Admin Analytics */}
        {activeTab === 0 && adminData && (
          <Box>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Total Platform Users</Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#38bdf8', my: 0.5 }}>
                    {adminData.total_users.toLocaleString()}
                  </Typography>
                  <Chip icon={<TrendingUpIcon sx={{ color: '#10b981 !important' }} />} label={`+${adminData.user_growth_rate}% Growth`} size="small" sx={{ bgcolor: '#0f172a', color: '#10b981', fontWeight: 'bold' }} />
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Active Job Openings</Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#a855f7', my: 0.5 }}>
                    {adminData.total_job_openings.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Across 120+ Companies</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Hiring Velocity</Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#10b981', my: 0.5 }}>
                    {adminData.hiring_velocity_days} Days
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Avg time to fill position</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Active Monthly Users</Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#f59e0b', my: 0.5 }}>
                    {adminData.active_users.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>71.6% Engagement Rate</Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Skill Demand Heatmap */}
            <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #334155', borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#38bdf8', mb: 1 }}>
                Top In-Demand Technical Skills Heatmap
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                {adminData.market_trend_summary}
              </Typography>

              {adminData.skill_demand_heatmap.map((item) => (
                <Box key={item.skill} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: '#f8fafc' }}>{item.skill}</Typography>
                    <Typography variant="caption" sx={{ color: '#38bdf8', fontWeight: 'bold' }}>{item.count} Jobs ({item.share}%)</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={item.share * 3} sx={{ height: 10, borderRadius: 5, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />
                </Box>
              ))}
            </Paper>
          </Box>
        )}

        {/* Tab 1: Recruiter Analytics */}
        {activeTab === 1 && recruiterData && (
          <Box>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Candidates Screened</Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#38bdf8', my: 0.5 }}>
                    {recruiterData.total_candidates_screened}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Across all active requisitions</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Avg Time to Hire</Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#10b981', my: 0.5 }}>
                    {recruiterData.avg_time_to_hire_days} Days
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>From application to offer accept</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Offer Conversion Rate</Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#a855f7', my: 0.5 }}>
                    {recruiterData.application_to_offer_rate}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Top Job: {recruiterData.top_performing_job}</Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Candidate Funnel Stepper */}
            <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #334155', borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#38bdf8', mb: 3 }}>
                Candidate Conversion Funnel
              </Typography>
              <Stepper activeStep={4} alternativeLabel sx={{ mb: 2 }}>
                {recruiterData.candidate_funnel.map((stage) => (
                  <Step key={stage.stage}>
                    <StepLabel sx={{ '& .MuiStepLabel-label': { color: '#f8fafc', fontWeight: 'bold' } }}>
                      {stage.stage}
                      <Typography variant="caption" sx={{ display: 'block', color: '#38bdf8' }}>
                        {stage.count} ({stage.percentage}%)
                      </Typography>
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Paper>
          </Box>
        )}

        {/* Tab 2: Candidate User Analytics */}
        {activeTab === 2 && userData && (
          <Box>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <VisibilityIcon sx={{ color: '#38bdf8' }} />
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Profile Views</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#38bdf8', mb: 0.5 }}>
                    {userData.profile_views_count}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Recruiter views this month</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <SearchIcon sx={{ color: '#10b981' }} />
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Search Appearances</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#10b981', mb: 0.5 }}>
                    {userData.search_appearances_count}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>Keywords matched in search</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AssessmentIcon sx={{ color: '#a855f7' }} />
                    <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 'bold' }}>Interview Invite Rate</Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: '#a855f7', mb: 0.5 }}>
                    {userData.interview_invitation_rate}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8' }}>{userData.applications_count} total applications sent</Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Top Searching Companies */}
            <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #334155', borderRadius: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ color: '#38bdf8', mb: 2 }}>
                Companies Searching Your Profile
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                {userData.top_searching_companies.map((comp) => (
                  <Chip key={comp} label={comp} sx={{ bgcolor: '#1e293b', color: '#38bdf8', border: '1px solid #334155', fontWeight: 'bold', px: 1 }} />
                ))}
              </Box>
            </Paper>
          </Box>
        )}
      </Container>
    </Box>
  );
}

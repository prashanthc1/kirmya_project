'use client';

import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Tabs,
  Tab,
  Button
} from '@mui/material';
import {
  ApplicationSummary,
  SavedJobDTO,
  CandidateInterview,
  ApplicationStatsDTO,
  AIApplicationInsightsDTO
} from '@/features/applications/types';
import { SavedJobs } from './SavedJobs';
import { JobAlertManager } from './JobAlertManager';
import { InterviewDashboard } from './InterviewDashboard';
import { ApplicationCard } from './ApplicationCard';

interface CandidateJobDashboardProps {
  applications?: ApplicationSummary[];
  savedJobs?: SavedJobDTO[];
  interviews?: CandidateInterview[];
  analytics?: { stats: ApplicationStatsDTO; analytics: any };
  insights?: AIApplicationInsightsDTO;
}

export function CandidateJobDashboard({
  applications = [],
  savedJobs = [],
  interviews = [],
  analytics,
  insights
}: CandidateJobDashboardProps) {
  const [tabValue, setTabValue] = React.useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const profileCompletion = 85;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header Banner */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>Candidate Job Dashboard</Typography>
          <Typography variant="body1" color="text.secondary">Welcome back! Here is your application overview.</Typography>
        </Box>
        <Card sx={{ width: 300, background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>Profile Completion: {profileCompletion}%</Typography>
            <LinearProgress variant="determinate" value={profileCompletion} sx={{ mb: 1 }} />
            <Typography variant="caption" color="text.secondary">Add your portfolio to reach 100%</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Metric Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Total Applications</Typography>
              <Typography variant="h3">{analytics?.stats?.total_applications || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Active Pipelines</Typography>
              <Typography variant="h3">{analytics?.stats?.active_applications || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Interviews Scheduled</Typography>
              <Typography variant="h3">{analytics?.stats?.interviews_scheduled || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(10px)' }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Offers Received</Typography>
              <Typography variant="h3">{analytics?.stats?.offers_received || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="dashboard tabs">
          <Tab label="Recent Applications" />
          <Tab label="Saved Jobs" />
          <Tab label="Upcoming Interviews" />
          <Tab label="Job Alerts" />
          <Tab label="AI Career Suggestions" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {applications.slice(0, 4).map(app => (
            <Grid item xs={12} md={6} key={app.id}>
              <ApplicationCard application={app} />
            </Grid>
          ))}
          {applications.length === 0 && <Typography>No recent applications.</Typography>}
        </Grid>
      )}

      {tabValue === 1 && (
        <SavedJobs jobs={savedJobs} />
      )}

      {tabValue === 2 && (
        <InterviewDashboard interviews={interviews} />
      )}

      {tabValue === 3 && (
        <JobAlertManager alerts={[]} onCreateAlert={() => {}} onDeleteAlert={() => {}} />
      )}

      {tabValue === 4 && (
        <Box>
          <Typography variant="h6" gutterBottom>AI Career Suggestions & Improvement Tips</Typography>
          {insights?.improvement_suggestions?.map((tip, idx) => (
             <Chip key={idx} label={tip} sx={{ m: 0.5 }} color="primary" variant="outlined" />
          )) || <Typography>No insights available at this time.</Typography>}
          
          <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>Recommended Jobs</Typography>
          {insights?.recommended_jobs?.map((job, idx) => (
             <Typography key={idx}>- {job}</Typography>
          ))}
        </Box>
      )}

    </Box>
  );
}

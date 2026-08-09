'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  ToggleButtonGroup,
  ToggleButton,
  Drawer,
} from '@mui/material';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import ViewListIcon from '@mui/icons-material/ViewList';

import { ApplicationSummary, ApplicationDetail, ApplicationStatsDTO, AIApplicationInsightsDTO } from '@/features/applications/types';
import { ApplicationStats } from './ApplicationStats';
import { ApplicationFilters } from './ApplicationFilters';
import { ApplicationPipeline } from './ApplicationPipeline';
import { ApplicationDetails } from './ApplicationDetails';
import { AIInsights } from './AIInsights';

interface ApplicationDashboardProps {
  applications: ApplicationSummary[];
  stats?: ApplicationStatsDTO;
  insights?: AIApplicationInsightsDTO;
  isLoading?: boolean;
  onSelectApplication: (id: string) => Promise<ApplicationDetail>;
  onWithdrawApplication: (id: string) => void;
  onToggleSaveJob?: (app: ApplicationSummary) => void;
}

export const ApplicationDashboard: React.FC<ApplicationDashboardProps> = ({
  applications,
  stats,
  insights,
  isLoading,
  onSelectApplication,
  onWithdrawApplication,
  onToggleSaveJob,
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  const [selectedDetail, setSelectedDetail] = useState<ApplicationDetail | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      searchQuery === '' ||
      app.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = selectedStatus === 'ALL' || app.current_status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleOpenDetail = async (app: ApplicationSummary) => {
    try {
      const detail = await onSelectApplication(app.id);
      setSelectedDetail(detail);
      setIsDrawerOpen(true);
    } catch {
      // fallback display
      setSelectedDetail({
        summary: app,
        job_description: 'Job description loaded.',
        requirements: ['TypeScript', 'React'],
        skills: ['React', 'Next.js'],
        timeline: [],
        notes: [],
        interviews: [],
      });
      setIsDrawerOpen(true);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Candidate Application Tracker Workspace
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Monitor job applications, track hiring stages, manage interviews, and optimize your career search with AI.
        </Typography>
      </Box>

      {/* KPI Overview Stats */}
      <Box sx={{ mb: 4 }}>
        <ApplicationStats stats={stats} isLoading={isLoading} />
      </Box>

      {/* AI Insights Bar */}
      <AIInsights insights={insights} />

      {/* View Switcher & Filters */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)}>
          <Tab label={`Active Tracker (${filteredApplications.length})`} />
          <Tab label="Archived & Withdrawn" />
        </Tabs>

        <ToggleButtonGroup value={viewMode} exclusive onChange={(_, val) => val && setViewMode(val)} size="small">
          <ToggleButton value="list">
            <ViewListIcon sx={{ mr: 0.5 }} /> List View
          </ToggleButton>
          <ToggleButton value="kanban">
            <ViewKanbanIcon sx={{ mr: 0.5 }} /> Kanban Board
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <ApplicationFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />

      {/* Application Board */}
      <ApplicationPipeline
        applications={filteredApplications}
        viewMode={viewMode}
        onViewDetails={handleOpenDetail}
        onWithdraw={(app) => onWithdrawApplication(app.id)}
        onToggleSave={onToggleSaveJob}
      />

      {/* Detail Slideover Drawer */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', md: 800 },
            background: 'rgba(18, 24, 38, 0.95)',
            backdropFilter: 'blur(20px)',
            p: 2,
          },
        }}
      >
        {selectedDetail && (
          <ApplicationDetails
            detail={selectedDetail}
            onClose={() => setIsDrawerOpen(false)}
            onWithdraw={() => onWithdrawApplication(selectedDetail.summary.id)}
          />
        )}
      </Drawer>
    </Container>
  );
};

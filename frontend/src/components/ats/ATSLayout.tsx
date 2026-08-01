'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, Typography, Tabs, Tab, Stack, Chip, Button, useTheme } from '@mui/material';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import ListAltIcon from '@mui/icons-material/ListAlt';
import EventIcon from '@mui/icons-material/Event';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import BarChartIcon from '@mui/icons-material/BarChart';
import RecruiterLayout from '../recruiter/RecruiterLayout';

interface ATSLayoutProps {
  children: React.ReactNode;
}

export const ATSLayout: React.FC<ATSLayoutProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  const tabs = [
    { label: 'Kanban Pipeline', route: '/recruiter/pipeline', icon: <ViewKanbanIcon fontSize="small" /> },
    { label: 'All Applications', route: '/recruiter/applications', icon: <ListAltIcon fontSize="small" /> },
    { label: 'Interviews & Schedules', route: '/recruiter/interviews', icon: <EventIcon fontSize="small" /> },
    { label: 'Job Offers & Contracts', route: '/recruiter/offers', icon: <LocalOfferIcon fontSize="small" /> },
    { label: 'Recruitment Analytics', route: '/recruiter/analytics', icon: <BarChartIcon fontSize="small" /> },
  ];

  const currentTab = tabs.findIndex((t) => pathname.startsWith(t.route));
  const activeTabValue = currentTab === -1 ? 0 : currentTab;

  return (
    <RecruiterLayout>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap gap={2}>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="h4" sx={{ fontWeight: 900 }}>
                Enterprise Applicant Tracking System (ATS)
              </Typography>
              <Chip label="LIFECYCLE PIPELINE" color="primary" size="small" sx={{ fontWeight: 800 }} />
            </Stack>
            <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
              Track candidates, manage pipeline stages, collaborate with hiring teams, schedule interviews, and issue job offers.
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Workspace Tabs */}
      <Tabs
        value={activeTabValue}
        onChange={(_, val) => router.push(tabs[val].route)}
        sx={{
          mb: 3,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', fontSize: '0.9rem' },
        }}
      >
        {tabs.map((t) => (
          <Tab key={t.route} label={t.label} icon={t.icon} iconPosition="start" />
        ))}
      </Tabs>

      {children}
    </RecruiterLayout>
  );
};

export default ATSLayout;

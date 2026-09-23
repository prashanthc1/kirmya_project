'use client';

import React from 'react';
import { Grid, Typography, Paper, useTheme } from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventIcon from '@mui/icons-material/Event';
import VerifiedIcon from '@mui/icons-material/Verified';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface HighlightsSectionProps {
  profile: any;
}

export const HighlightsSection: React.FC<HighlightsSectionProps> = ({ profile }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const highlights = [
    { label: 'Open Positions', value: `${profile.openJobsCount || 18} Active`, icon: <WorkIcon sx={{ color: '#10b981' }} /> },
    { label: 'Total Employees', value: (profile.employeesCount || 12500).toLocaleString(), icon: <PeopleIcon sx={{ color: "primary.main" }} /> },
    { label: 'Followers', value: (profile.followersCount || 14200).toLocaleString(), icon: <GroupsIcon sx={{ color: '#ec4899' }} /> },
    { label: 'Global Offices', value: '3 Locations', icon: <LocationOnIcon sx={{ color: '#f59e0b' }} /> },
    { label: 'Years in Business', value: `${new Date().getFullYear() - (profile.foundedYear || 1997)} Years`, icon: <EventIcon sx={{ color: '#06b6d4' }} /> },
    { label: 'Hiring Status', value: profile.isHiring ? 'Actively Hiring' : 'Selective', icon: <CheckCircleIcon sx={{ color: '#10b981' }} /> },
    { label: 'Verification', value: profile.isVerified ? 'Verified Employer' : 'Standard', icon: <VerifiedIcon sx={{ color: "primary.main" }} /> },
    { label: 'Response Time', value: profile.responseTime || 'Within 24 Hours', icon: <AccessTimeIcon sx={{ color: "primary.main" }} /> },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      {highlights.map((h, idx) => (
        <Grid item xs={6} sm={4} md={3} key={idx}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: '16px',
              bgcolor: isDark ? "background.paper" : 'rgba(241, 245, 249, 0.8)',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 1.2,
                borderRadius: '12px',
                bgcolor: "action.hover",
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {h.icon}
            </Paper>
            <div>
              <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2, fontSize: '1.05rem' }}>
                {h.value}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {h.label}
              </Typography>
            </div>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default HighlightsSection;

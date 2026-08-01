'use client';

import React from 'react';
import { Box, Typography, Grid, Paper, Stack, useTheme } from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import GlassCard from '../landing/GlassCard';

interface DepartmentsSectionProps {
  departments: any[];
}

export const DepartmentsSection: React.FC<DepartmentsSectionProps> = ({ departments }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <GlassCard sx={{ p: { xs: 3, md: 4 }, mb: 4 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <AccountTreeIcon sx={{ color: '#06b6d4', fontSize: 28 }} />
        <Typography variant="h5" sx={{ fontWeight: 900 }}>
          Departments &amp; Functional Areas
        </Typography>
      </Stack>

      <Grid container spacing={2.5}>
        {departments.map((dept) => (
          <Grid item xs={12} sm={6} md={4} key={dept.id}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5 }}>
                {dept.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {dept.employeeCount} Professionals • {dept.openJobs} Open Roles
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </GlassCard>
  );
};

export default DepartmentsSection;

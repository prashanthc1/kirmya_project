'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Stack,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Switch,
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';

export const AdminOnboardingDashboard: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <RocketLaunchIcon sx={{ color: 'primary.main', fontSize: 36 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Executive Onboarding Control & Funnel Center
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Monitor step conversion, drop-off rates, skip ratios, and configure step order and requirements.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Total Started</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5 }}>1,420</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Completion Rate</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'success.main' }}>87.3%</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Avg Time to Finish</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'info.main' }}>4.5 mins</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Avg Steps Completed</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'warning.main' }}>13.8 / 15</Typography>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: '24px', p: 1, mb: 4 }}>
        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="scrollable">
          <Tab label="Funnel Conversion" sx={{ fontWeight: 800 }} />
          <Tab label="Step Configuration" sx={{ fontWeight: 800 }} />
          <Tab label="Skip & Drop-off Analytics" sx={{ fontWeight: 800 }} />
        </Tabs>
      </Card>

      {/* Tab 0: Funnel Conversion */}
      {tabIndex === 0 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Step Conversion Funnel Breakdown
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Step Order</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Step Title</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Users Reached</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Completion %</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Drop-off %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>1</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Welcome to Kirmya</TableCell>
                  <TableCell>1,420</TableCell>
                  <TableCell>99.3%</TableCell>
                  <TableCell>0.7%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>5</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Work Experience</TableCell>
                  <TableCell>1,350</TableCell>
                  <TableCell>95.1%</TableCell>
                  <TableCell>4.2%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>15</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Profile Review & Finish</TableCell>
                  <TableCell>1,240</TableCell>
                  <TableCell>87.3%</TableCell>
                  <TableCell>0.0%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 1: Step Configuration */}
      {tabIndex === 1 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Active Onboarding Steps Configuration
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Step Key</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Target Role</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Required?</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Enabled?</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace' }}>welcome</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Welcome to Kirmya</TableCell>
                  <TableCell>all</TableCell>
                  <TableCell><Chip label="REQUIRED" color="error" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                  <TableCell><Switch defaultChecked /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace' }}>profile_photo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Profile Photo</TableCell>
                  <TableCell>all</TableCell>
                  <TableCell><Chip label="OPTIONAL" color="info" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                  <TableCell><Switch defaultChecked /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 2: Skip & Drop-off */}
      {tabIndex === 2 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Highest Skip Rate Steps
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '16px' }}>
                <Typography variant="subtitle2" color="text.secondary">Profile Photo Upload</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5, color: 'warning.main' }}>18.4% Skipped</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '16px' }}>
                <Typography variant="subtitle2" color="text.secondary">Education & Degrees</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5, color: 'warning.main' }}>12.1% Skipped</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '16px' }}>
                <Typography variant="subtitle2" color="text.secondary">Community Discovery</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5, color: 'warning.main' }}>9.5% Skipped</Typography>
              </Card>
            </Grid>
          </Grid>
        </Card>
      )}
    </Box>
  );
};

export default AdminOnboardingDashboard;

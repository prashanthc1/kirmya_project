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
  Button,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SecurityIcon from '@mui/icons-material/Security';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import GavelIcon from '@mui/icons-material/Gavel';

export const AdminTrustSafetyDashboard: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <AdminPanelSettingsIcon sx={{ color: 'primary.main', fontSize: 36 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Executive Trust & Safety Control Center
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage reports queue, moderation decisions, safety appeals, fake job detection, and platform safety policies.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Open Reports</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'warning.main' }}>12</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>High Risk Alerts</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'error.main' }}>2</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Avg Resolution Time</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'success.main' }}>4.2 hrs</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Pending Appeals</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'info.main' }}>1</Typography>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: '24px', p: 1, mb: 4 }}>
        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="scrollable">
          <Tab label="Reports Queue" sx={{ fontWeight: 800 }} />
          <Tab label="Moderation Appeals" sx={{ fontWeight: 800 }} />
          <Tab label="Safety Policy Rules" sx={{ fontWeight: 800 }} />
          <Tab label="Safety Metrics" sx={{ fontWeight: 800 }} />
        </Tabs>
      </Card>

      {/* Tab 0: Reports Queue */}
      {tabIndex === 0 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Moderation Reports Queue
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Target Entity</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Remote Senior Developer Job</TableCell>
                  <TableCell><Chip label="FAKE_JOB" color="error" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                  <TableCell><Chip label="HIGH" color="warning" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                  <TableCell><Chip label="SUBMITTED" size="small" /></TableCell>
                  <TableCell><Button size="small" variant="contained">Review Report</Button></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 1: Appeals */}
      {tabIndex === 1 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Pending User Appeals Queue
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Appeal ID</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Explanation</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace' }}>app-501</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Legitimate Recruiter Identity</TableCell>
                  <TableCell>Provided official company documentation.</TableCell>
                  <TableCell><Chip label="SUBMITTED" color="info" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                  <TableCell><Button size="small" variant="contained" color="success">Resolve Appeal</Button></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 2: Rules */}
      {tabIndex === 2 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Active Safety & Scam Detection Rules
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Rule Code</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Rule Name</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Action Recommendation</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace' }}>RULE-ADVANCE-FEE</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Detect Advance Payment Demands</TableCell>
                  <TableCell>job_safety</TableCell>
                  <TableCell>flag_high_risk</TableCell>
                  <TableCell><Chip label="ACTIVE" color="success" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 3: Metrics */}
      {tabIndex === 3 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Trust & Safety Analytics Metrics
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '16px' }}>
                <Typography variant="caption" color="text.secondary">Total User Blocks</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>84</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '16px' }}>
                <Typography variant="caption" color="text.secondary">Content Removals</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>18</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '16px' }}>
                <Typography variant="caption" color="text.secondary">Account Suspensions</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>3</Typography>
              </Card>
            </Grid>
          </Grid>
        </Card>
      )}
    </Box>
  );
};

export default AdminTrustSafetyDashboard;

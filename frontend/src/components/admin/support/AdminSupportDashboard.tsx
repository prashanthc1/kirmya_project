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
import HeadsetMicIcon from '@mui/icons-material/HeadsetMic';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';

export const AdminSupportDashboard: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <HeadsetMicIcon sx={{ color: 'primary.main', fontSize: 36 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Executive Support & Help Desk Console
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage ticket queues, SLA compliance, knowledge base articles, CSAT metrics, and user feedback.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Open Tickets</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'warning.main' }}>8</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Unassigned Queue</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'error.main' }}>2</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>First Response SLA</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'success.main' }}>18m</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Customer Satisfaction (CSAT)</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'info.main' }}>4.85 / 5</Typography>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: '24px', p: 1, mb: 4 }}>
        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="scrollable">
          <Tab label="Tickets Queue" sx={{ fontWeight: 800 }} />
          <Tab label="Knowledge Base Manager" sx={{ fontWeight: 800 }} />
          <Tab label="Feature Requests & Bugs" sx={{ fontWeight: 800 }} />
          <Tab label="Support Analytics" sx={{ fontWeight: 800 }} />
        </Tabs>
      </Card>

      {/* Tab 0: Ticket Queue */}
      {tabIndex === 0 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Support Tickets Queue
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Ticket Number</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, fontFamily: 'monospace' }}>KIR-2026-000101</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>candidate@kirmya.com</TableCell>
                  <TableCell>Job Application Status Sync Inquiry</TableCell>
                  <TableCell><Chip label="JOBS" size="small" /></TableCell>
                  <TableCell><Chip label="NORMAL" color="info" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                  <TableCell><Chip label="OPEN" color="warning" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                  <TableCell><Button size="small" variant="contained">Manage Ticket</Button></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 1: Knowledge Base */}
      {tabIndex === 1 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Knowledge Base Articles
            </Typography>
            <Button variant="contained" sx={{ borderRadius: '12px', fontWeight: 800 }}>
              + Create Article
            </Button>
          </Stack>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Article Title</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Views</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Helpful Ratio</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>How to Create and Optimize Your Kirmya Candidate Profile</TableCell>
                  <TableCell>getting_started</TableCell>
                  <TableCell>1,420</TableCell>
                  <TableCell>93.9%</TableCell>
                  <TableCell><Chip label="PUBLISHED" color="success" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 2: Feedback & Bugs */}
      {tabIndex === 2 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            User Feedback & Bug Triage Queue
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Dark Mode Toggle for Application Tracking Board</TableCell>
                  <TableCell><Chip label="FEATURE" color="primary" size="small" /></TableCell>
                  <TableCell><Chip label="PLANNED" color="info" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 3: Analytics */}
      {tabIndex === 3 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Support Operational Metrics
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '16px' }}>
                <Typography variant="caption" color="text.secondary">Avg Resolution Time</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>2.4 Hours</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ p: 2, bgcolor: 'action.hover', borderRadius: '16px' }}>
                <Typography variant="caption" color="text.secondary">Knowledge Base Deflection</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5 }}>68.2%</Typography>
              </Card>
            </Grid>
          </Grid>
        </Card>
      )}
    </Box>
  );
};

export default AdminSupportDashboard;

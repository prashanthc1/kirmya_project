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
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export const AdminSecurityDashboard: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <AdminPanelSettingsIcon sx={{ color: 'primary.main', fontSize: 36 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Executive Security & Incident Control Center
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Monitor real-time login security telemetry, incident response, MFA adoption, and platform security policies.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Total Security Events</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'primary.main' }}>1,280</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Failed Logins (24h)</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'warning.main' }}>4</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>MFA Adoption Rate</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'success.main' }}>42.5%</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Active Incidents</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'info.main' }}>0</Typography>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: '24px', p: 1, mb: 4 }}>
        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="scrollable">
          <Tab label="Security Telemetry Events" sx={{ fontWeight: 800 }} />
          <Tab label="Security Incident Queue" sx={{ fontWeight: 800 }} />
          <Tab label="Platform Security Policies" sx={{ fontWeight: 800 }} />
        </Tabs>
      </Card>

      {/* Tab 0: Telemetry */}
      {tabIndex === 0 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Real-Time Security Event Stream
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Event Type</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Severity</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>IP Address</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>User Agent</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>login.success</TableCell>
                  <TableCell><Chip label="Low" color="success" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                  <TableCell>127.0.0.1</TableCell>
                  <TableCell>Chrome / Windows 11</TableCell>
                  <TableCell>{new Date().toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>security.mfa.enabled</TableCell>
                  <TableCell><Chip label="Medium" color="info" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                  <TableCell>127.0.0.1</TableCell>
                  <TableCell>Chrome / Windows 11</TableCell>
                  <TableCell>{new Date(Date.now() - 3600000).toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 1: Incidents */}
      {tabIndex === 1 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Security Incidents Workflow
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Title / Incident</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Severity</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Affected Area</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>No Active Security Incidents</TableCell>
                  <TableCell><Chip label="Low" color="success" size="small" /></TableCell>
                  <TableCell>Authentication Services</TableCell>
                  <TableCell><Chip label="All Clear" color="success" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                  <TableCell><Button size="small">Log New Incident</Button></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 2: Policies */}
      {tabIndex === 2 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Platform Security Configuration Rules
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Policy Setting</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Configured Value</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Enforcement Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Minimum Password Length</TableCell>
                  <TableCell>12 Characters</TableCell>
                  <TableCell><Chip label="Active Policy" color="success" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Session Idle Timeout</TableCell>
                  <TableCell>60 Minutes</TableCell>
                  <TableCell><Chip label="Active Policy" color="success" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>MFA Mandate for Administrators</TableCell>
                  <TableCell>Enabled</TableCell>
                  <TableCell><Chip label="Enforced Server-Side" color="primary" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
};

export default AdminSecurityDashboard;

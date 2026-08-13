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
  Divider,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AssignmentIcon from '@mui/icons-material/Assignment';
import StorageIcon from '@mui/icons-material/Storage';
import GavelIcon from '@mui/icons-material/Gavel';
import HubIcon from '@mui/icons-material/Hub';

export const AdminPrivacyDashboard: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <AdminPanelSettingsIcon sx={{ color: 'primary.main', fontSize: 36 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Executive Privacy & Data Protection Console
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Subject Access Requests (SAR), Data Retention Policies, RoPA Data Processing Records, and Sub-processor Inventory.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Total Privacy Requests</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'primary.main' }}>42</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Pending SARs</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'warning.main' }}>3</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Deletion Grace Period Jobs</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'info.main' }}>1</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Active Sub-Processors</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'success.main' }}>2</Typography>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: '24px', p: 1, mb: 4 }}>
        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="scrollable">
          <Tab label="Subject Access Requests (SAR)" sx={{ fontWeight: 800 }} />
          <Tab label="Record of Processing Activities (RoPA)" sx={{ fontWeight: 800 }} />
          <Tab label="Retention Policies" sx={{ fontWeight: 800 }} />
          <Tab label="Third-Party Sub-Processors" sx={{ fontWeight: 800 }} />
        </Tabs>
      </Card>

      {/* Tab 0: Requests */}
      {tabIndex === 0 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Subject Access Requests (SAR) Queue
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Request Type</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Data Export Request (JSON)</TableCell>
                  <TableCell>2026-09-12</TableCell>
                  <TableCell><Chip label="Completed" color="success" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                  <TableCell><Button size="small">View Details</Button></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Account Deletion Request</TableCell>
                  <TableCell>2026-09-15</TableCell>
                  <TableCell><Chip label="Processing Grace Period" color="warning" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                  <TableCell><Button size="small">Manage Request</Button></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 1: RoPA */}
      {tabIndex === 1 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Record of Processing Activities (RoPA Registry)
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Processing Activity</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Purpose</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Data Category</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Legal Basis</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>User Authentication & Security</TableCell>
                  <TableCell>Maintain user identity and CSRF security</TableCell>
                  <TableCell>Account Data</TableCell>
                  <TableCell><Chip label="Contractual Necessity" color="primary" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>AI Job & Candidate Matching</TableCell>
                  <TableCell>Match candidate profiles with job openings</TableCell>
                  <TableCell>Profile & Resume Data</TableCell>
                  <TableCell><Chip label="User Consent" color="info" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 2: Retention */}
      {tabIndex === 2 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Data Retention & Purge Policies
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Data Category</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Retention Period</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Purge Action</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Inoperative Accounts</TableCell>
                  <TableCell>365 Days</TableCell>
                  <TableCell>Anonymize Personal Identifiers</TableCell>
                  <TableCell><Chip label="Active Policy" color="success" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Transient Message Telemetry</TableCell>
                  <TableCell>180 Days</TableCell>
                  <TableCell>Delete Telemetry Logs</TableCell>
                  <TableCell><Chip label="Active Policy" color="success" size="small" sx={{ fontWeight: 800 }} /></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Tab 3: Sub-processors */}
      {tabIndex === 3 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            Registered Third-Party Sub-Processors
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Provider</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Service</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Data Shared</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Region</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>SendGrid / Mailtrap</TableCell>
                  <TableCell>Transactional Email Delivery</TableCell>
                  <TableCell>Name & Email Address</TableCell>
                  <TableCell>United States</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>AWS PostgreSQL</TableCell>
                  <TableCell>Encrypted Core Datastore</TableCell>
                  <TableCell>Full Profile & Platform Data</TableCell>
                  <TableCell>United States / AWS</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  );
};

export default AdminPrivacyDashboard;

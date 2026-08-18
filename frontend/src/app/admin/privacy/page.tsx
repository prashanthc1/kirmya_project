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
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import StorageIcon from '@mui/icons-material/Storage';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import AutoDeleteIcon from '@mui/icons-material/AutoDelete';
import GavelIcon from '@mui/icons-material/Gavel';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import HubIcon from '@mui/icons-material/Hub';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import MenuBookIcon from '@mui/icons-material/MenuBook';

import DataInventoryTable from '@/components/privacy/DataInventoryTable';
import DataRequestManager from '@/components/privacy/DataRequestManager';
import RetentionManager from '@/components/privacy/RetentionManager';
import LegalHoldDialog from '@/components/privacy/LegalHoldDialog';
import AccessReviewDesk from '@/components/privacy/AccessReviewDesk';
import ThirdPartyProcessorsCard from '@/components/privacy/ThirdPartyProcessorsCard';
import PrivacyIncidentManager from '@/components/privacy/PrivacyIncidentManager';
import PolicyVersionTable from '@/components/privacy/PolicyVersionTable';

export default function AdminPrivacyPage() {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <AdminPanelSettingsIcon sx={{ color: 'primary.main', fontSize: 38 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Executive Data Governance & Privacy Desk
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Central operational hub for RoPA data inventory, DSAR fulfillment, automated retention, legal holds, access reviews, sub-processors, and breach tracking.
          </Typography>
        </Box>
      </Stack>

      {/* KPI Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Total Tracked Datasets</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'primary.main' }}>4</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Active DSAR Requests</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'warning.main' }}>3</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Active Legal Holds</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'info.main' }}>1</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2.5, borderRadius: '20px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>Verified Sub-Processors</Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, mt: 0.5, color: 'success.main' }}>3</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs Navigation */}
      <Card sx={{ borderRadius: '24px', p: 1, mb: 4, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="scrollable" scrollButtons="auto">
          <Tab icon={<StorageIcon />} iconPosition="start" label="Data Inventory (RoPA)" sx={{ fontWeight: 800 }} />
          <Tab icon={<AssignmentIndIcon />} iconPosition="start" label="Subject Requests (DSAR)" sx={{ fontWeight: 800 }} />
          <Tab icon={<AutoDeleteIcon />} iconPosition="start" label="Retention Rules" sx={{ fontWeight: 800 }} />
          <Tab icon={<GavelIcon />} iconPosition="start" label="Legal Holds" sx={{ fontWeight: 800 }} />
          <Tab icon={<VerifiedUserIcon />} iconPosition="start" label="Access Reviews" sx={{ fontWeight: 800 }} />
          <Tab icon={<HubIcon />} iconPosition="start" label="Sub-Processors" sx={{ fontWeight: 800 }} />
          <Tab icon={<ReportProblemIcon />} iconPosition="start" label="Privacy Incidents" sx={{ fontWeight: 800 }} />
          <Tab icon={<MenuBookIcon />} iconPosition="start" label="Policy Versions" sx={{ fontWeight: 800 }} />
        </Tabs>
      </Card>

      {/* Tab Panels */}
      {tabIndex === 0 && <DataInventoryTable />}
      {tabIndex === 1 && <DataRequestManager />}
      {tabIndex === 2 && <RetentionManager />}
      {tabIndex === 3 && <LegalHoldDialog />}
      {tabIndex === 4 && <AccessReviewDesk />}
      {tabIndex === 5 && <ThirdPartyProcessorsCard />}
      {tabIndex === 6 && <PrivacyIncidentManager />}
      {tabIndex === 7 && <PolicyVersionTable />}
    </Box>
  );
}

'use client';

import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Tabs,
  Tab,
  Stack,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import AddIcon from '@mui/icons-material/Add';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EqualizerIcon from '@mui/icons-material/Equalizer';

import { JobAlert, SavedSearch, AlertDeliveryHistory } from '@/features/job-alerts/types';
import { AlertList } from './AlertList';
import { AlertFilters } from './AlertFilters';
import { CreateAlertDialog } from './CreateAlertDialog';
import { SavedSearchManager } from './SavedSearchManager';
import { AlertHistory } from './AlertHistory';

interface JobAlertsDashboardProps {
  alerts: JobAlert[];
  searches: SavedSearch[];
  history: AlertDeliveryHistory[];
  onCreateAlert: (alert: Partial<JobAlert>) => void;
  onUpdateAlert: (id: string, alert: Partial<JobAlert>) => void;
  onDeleteAlert: (id: string) => void;
  onTogglePauseAlert: (alert: JobAlert) => void;
  onCreateSearch: (search: Partial<SavedSearch>) => void;
  onUpdateSearch: (id: string, search: Partial<SavedSearch>) => void;
  onDeleteSearch: (id: string) => void;
}

export const JobAlertsDashboard: React.FC<JobAlertsDashboardProps> = ({
  alerts,
  searches,
  history,
  onCreateAlert,
  onUpdateAlert,
  onDeleteAlert,
  onTogglePauseAlert,
  onCreateSearch,
  onUpdateSearch,
  onDeleteSearch,
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState<JobAlert | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [frequencyFilter, setFrequencyFilter] = useState('ALL');

  const filteredAlerts = alerts.filter((a) => {
    const matchesQuery =
      searchQuery === '' ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.keywords.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || (statusFilter === 'ACTIVE' && a.is_active) || (statusFilter === 'PAUSED' && !a.is_active);

    const matchesFreq = frequencyFilter === 'ALL' || a.frequency === frequencyFilter;

    return matchesQuery && matchesStatus && matchesFreq;
  });

  const activeAlertsCount = alerts.filter((a) => a.is_active).length;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <NotificationsActiveIcon sx={{ color: 'primary.main', fontSize: 36 }} /> Job Alerts & Automated Notifications
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Configure automated search notifications, manage saved queries, and track real-time delivery performance.
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingAlert(null);
              setOpenCreateModal(true);
            }}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3 }}
          >
            Create Job Alert
          </Button>
        </Stack>
      </Box>

      {/* Overview Stat Badges */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Active Job Alerts</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#0066FF' }}>{activeAlertsCount}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Saved Search Queries</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#9933FF' }}>{searches.length}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Application Success Rate</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#00CC66' }}>24.5%</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>Total Alerts Delivered</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, color: '#00CCFF' }}>148</Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs View */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)}>
          <Tab label={`Active Alerts (${filteredAlerts.length})`} />
          <Tab label={`Saved Searches (${searches.length})`} />
          <Tab label="Delivery History & Stats" />
        </Tabs>
      </Box>

      {tabIndex === 0 && (
        <Box>
          <AlertFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            frequencyFilter={frequencyFilter}
            onFrequencyChange={setFrequencyFilter}
          />
          <AlertList
            alerts={filteredAlerts}
            onEditAlert={(a) => {
              setEditingAlert(a);
              setOpenCreateModal(true);
            }}
            onDeleteAlert={(a) => onDeleteAlert(a.id)}
            onTogglePauseAlert={onTogglePauseAlert}
          />
        </Box>
      )}

      {tabIndex === 1 && (
        <SavedSearchManager
          searches={searches}
          onCreateSearch={onCreateSearch}
          onUpdateSearch={onUpdateSearch}
          onDeleteSearch={onDeleteSearch}
        />
      )}

      {tabIndex === 2 && <AlertHistory history={history} />}

      <CreateAlertDialog
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        initialAlert={editingAlert}
        onSubmit={(alertData) => {
          if (editingAlert) {
            onUpdateAlert(editingAlert.id, alertData);
          } else {
            onCreateAlert(alertData);
          }
        }}
      />
    </Container>
  );
};

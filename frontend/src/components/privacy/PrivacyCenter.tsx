'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Tab,
  Tabs,
  Stack,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  Button,
  Divider,
  Alert,
  Chip,
  useTheme,
  Snackbar,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import HistoryIcon from '@mui/icons-material/History';
import CookieIcon from '@mui/icons-material/Cookie';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CookiePreferencesModal from './CookiePreferencesModal';
import ConsentHistoryView from './ConsentHistoryView';
import DataExportView from './DataExportView';
import AccountDeletionModal from './AccountDeletionModal';
import { PrivacySettings } from '../../features/security/types';
import { securityApi } from '../../features/security/services/securityApi';

interface PrivacyCenterProps {
  initialTab?: number;
}

export const PrivacyCenter: React.FC<PrivacyCenterProps> = ({ initialTab = 0 }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [tabIndex, setTabIndex] = useState(initialTab);

  const [prefs, setPrefs] = useState<PrivacySettings>({
    user_id: 'u1',
    profile_visibility: 'Public',
    discover_in_search: true,
    recruiter_discoverable: true,
    recruiter_contactable: true,
    show_resume_to_recruiters: true,
    messaging_permission: 'Anyone',
    community_visibility: 'Public',
    search_personalization: true,
    ai_data_usage: true,
    analytics_consent: true,
    marketing_consent: false,
    updated_at: new Date().toISOString(),
  });

  const [openCookieModal, setOpenCookieModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [saveAlert, setSaveAlert] = useState(false);

  useEffect(() => {
    securityApi.getPrivacySettings().then(setPrefs);
  }, []);

  const handleToggle = async (key: keyof PrivacySettings) => {
    const updatedValue = !prefs[key];
    const updated = await securityApi.updatePrivacySettings({ [key]: updatedValue });
    setPrefs(updated);
    setSaveAlert(true);
  };

  const handleSelectChange = async (key: keyof PrivacySettings, val: string) => {
    const updated = await securityApi.updatePrivacySettings({ [key]: val as any });
    setPrefs(updated);
    setSaveAlert(true);
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <SecurityIcon sx={{ color: 'primary.main', fontSize: 36 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Centralized Privacy & Data Protection Center
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage profile visibility, search discovery, recruiter access, AI personalization, and download your data.
          </Typography>
        </Box>
      </Stack>

      <Card
        sx={{
          borderRadius: '24px',
          p: 1,
          mb: 4,
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} variant="scrollable">
          <Tab label="Privacy Overview" sx={{ fontWeight: 800 }} />
          <Tab label="Visibility & Discovery" sx={{ fontWeight: 800 }} />
          <Tab label="Recruiter & Messaging" sx={{ fontWeight: 800 }} />
          <Tab label="AI & Analytics" sx={{ fontWeight: 800 }} />
          <Tab label="Cookie Preferences" sx={{ fontWeight: 800 }} />
          <Tab label="Data Export & Rights" sx={{ fontWeight: 800 }} />
          <Tab label="Account Deletion" sx={{ fontWeight: 800, color: 'error.main' }} />
        </Tabs>
      </Card>

      {/* Tab 0: Overview */}
      {tabIndex === 0 && (
        <Stack spacing={3}>
          <Alert severity="info" sx={{ borderRadius: '16px' }}>
            Kirmya respects your privacy rights. Mandatory security notifications and legal requirements bypass optional marketing choices.
          </Alert>

          <Card sx={{ borderRadius: '24px', p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Quick Privacy Controls Summary
            </Typography>
            <Stack spacing={2} divider={<Divider />}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>Profile Visibility</Typography>
                  <Typography variant="caption" color="text.secondary">Who can see your professional profile</Typography>
                </Box>
                <Chip label={prefs.profile_visibility} color="primary" sx={{ fontWeight: 800 }} />
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>Recruiter Discoverability</Typography>
                  <Typography variant="caption" color="text.secondary">Allow recruiters to discover your skills</Typography>
                </Box>
                <Chip
                  label={prefs.recruiter_discoverable ? 'Enabled' : 'Disabled'}
                  color={prefs.recruiter_discoverable ? 'success' : 'default'}
                  sx={{ fontWeight: 800 }}
                />
              </Stack>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>AI Features & Data Usage</Typography>
                  <Typography variant="caption" color="text.secondary">Allow AI job & career recommendations</Typography>
                </Box>
                <Chip
                  label={prefs.ai_data_usage ? 'Allowed' : 'Opted Out'}
                  color={prefs.ai_data_usage ? 'info' : 'default'}
                  sx={{ fontWeight: 800 }}
                />
              </Stack>
            </Stack>
          </Card>
        </Stack>
      )}

      {/* Tab 1: Visibility */}
      {tabIndex === 1 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
            Profile Visibility & Search Discovery
          </Typography>
          <Stack spacing={3} divider={<Divider />}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Profile Visibility Scope</Typography>
              <Select
                fullWidth
                value={prefs.profile_visibility}
                onChange={(e) => handleSelectChange('profile_visibility', e.target.value)}
                sx={{ mt: 1, borderRadius: '12px' }}
              >
                <MenuItem value="Public">Public (Anyone on the internet)</MenuItem>
                <MenuItem value="Registered">Registered Kirmya Members Only</MenuItem>
                <MenuItem value="Connections">Connections Only</MenuItem>
                <MenuItem value="Recruiters">Verified Recruiters Only</MenuItem>
                <MenuItem value="Private">Private (Hidden from directory)</MenuItem>
              </Select>
            </Box>

            <FormControlLabel
              control={<Switch checked={prefs.discover_in_search} onChange={() => handleToggle('discover_in_search')} />}
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>Appear in People Search</Typography>
                  <Typography variant="caption" color="text.secondary">Allow members to search for your name or title</Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={<Switch checked={prefs.community_visibility === 'Public'} onChange={() => handleSelectChange('community_visibility', prefs.community_visibility === 'Public' ? 'Private' : 'Public')} />}
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>Community Feed Activity Visibility</Typography>
                  <Typography variant="caption" color="text.secondary">Show your posts and comments in public developer feed</Typography>
                </Box>
              }
            />
          </Stack>
        </Card>
      )}

      {/* Tab 2: Recruiter */}
      {tabIndex === 2 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 3 }}>
            Recruiter & Messaging Privacy
          </Typography>
          <Stack spacing={3} divider={<Divider />}>
            <FormControlLabel
              control={<Switch checked={prefs.recruiter_discoverable} onChange={() => handleToggle('recruiter_discoverable')} />}
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>Allow Verified Recruiters to Discover Me</Typography>
                  <Typography variant="caption" color="text.secondary">Your profile will appear in recruiter talent pools</Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={<Switch checked={prefs.show_resume_to_recruiters} onChange={() => handleToggle('show_resume_to_recruiters')} />}
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>Show Uploaded Resume to Recruiters</Typography>
                  <Typography variant="caption" color="text.secondary">Permit recruiters to view your attached resume</Typography>
                </Box>
              }
            />

            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Who Can Send Direct Messages</Typography>
              <Select
                fullWidth
                value={prefs.messaging_permission}
                onChange={(e) => handleSelectChange('messaging_permission', e.target.value)}
                sx={{ mt: 1, borderRadius: '12px' }}
              >
                <MenuItem value="Anyone">Any Kirmya Member</MenuItem>
                <MenuItem value="Connections">Connections Only</MenuItem>
                <MenuItem value="Recruiters">Verified Recruiters & Connections</MenuItem>
                <MenuItem value="None">Nobody (Disable inbound DMs)</MenuItem>
              </Select>
            </Box>
          </Stack>
        </Card>
      )}

      {/* Tab 3: AI */}
      {tabIndex === 3 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
            <SmartToyIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              AI Personalization & Analytics Privacy
            </Typography>
          </Stack>
          <Stack spacing={3} divider={<Divider />}>
            <FormControlLabel
              control={<Switch checked={prefs.ai_data_usage} onChange={() => handleToggle('ai_data_usage')} />}
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>AI Job & Career Personalization</Typography>
                  <Typography variant="caption" color="text.secondary">Allow Kirmya AI to generate personalized job matches</Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={<Switch checked={prefs.search_personalization} onChange={() => handleToggle('search_personalization')} />}
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>Search Personalization</Typography>
                  <Typography variant="caption" color="text.secondary">Customize search results based on past view history</Typography>
                </Box>
              }
            />

            <FormControlLabel
              control={<Switch checked={prefs.analytics_consent} onChange={() => handleToggle('analytics_consent')} />}
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>Product Analytics Consent</Typography>
                  <Typography variant="caption" color="text.secondary">Share anonymous usage data to improve application UI</Typography>
                </Box>
              }
            />
          </Stack>
        </Card>
      )}

      {/* Tab 4: Cookies */}
      {tabIndex === 4 && (
        <Card sx={{ borderRadius: '24px', p: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <CookieIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>Cookie Preferences</Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Manage category consent for cookies. Necessary security cookies cannot be disabled.
          </Typography>
          <Button variant="contained" onClick={() => setOpenCookieModal(true)} sx={{ borderRadius: '12px', fontWeight: 800 }}>
            Open Cookie Manager
          </Button>
          <CookiePreferencesModal open={openCookieModal} onClose={() => setOpenCookieModal(false)} />
        </Card>
      )}

      {/* Tab 5: Export */}
      {tabIndex === 5 && (
        <Stack spacing={4}>
          <DataExportView />
          <ConsentHistoryView />
        </Stack>
      )}

      {/* Tab 6: Deletion */}
      {tabIndex === 6 && (
        <Card sx={{ borderRadius: '24px', p: 3, border: '1px solid rgba(239, 68, 68, 0.4)' }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <DeleteForeverIcon color="error" />
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'error.main' }}>
              Account Data Deletion & Closure
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Initiating account deletion triggers a 14-day grace period during which you can cancel deletion.
          </Typography>
          <Button variant="contained" color="error" onClick={() => setOpenDeleteModal(true)} sx={{ borderRadius: '12px', fontWeight: 800 }}>
            Request Account Deletion
          </Button>
          <AccountDeletionModal open={openDeleteModal} onClose={() => setOpenDeleteModal(false)} />
        </Card>
      )}

      <Snackbar
        open={saveAlert}
        autoHideDuration={3000}
        onClose={() => setSaveAlert(false)}
        message="Privacy preferences updated"
      />
    </Box>
  );
};

export default PrivacyCenter;

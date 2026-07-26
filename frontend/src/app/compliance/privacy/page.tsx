'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ShieldIcon from '@mui/icons-material/Shield';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CookieIcon from '@mui/icons-material/Cookie';

import { complianceApi } from '../../../features/compliance/api';
import {
  ConsentRecord,
  DataRequest,
} from '../../../features/compliance/types';

export default function PrivacyCenterPage() {
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [dataRequests, setDataRequests] = useState<DataRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Consent Toggles
  const [analyticsGranted, setAnalyticsGranted] = useState(true);
  const [marketingGranted, setMarketingGranted] = useState(false);
  const [thirdPartyGranted, setThirdPartyGranted] = useState(false);

  // Deletion Modal
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cRes, rRes] = await Promise.all([
        complianceApi.getConsents(),
        complianceApi.getDataRequests(),
      ]);
      const list = cRes.data || [];
      setConsents(list);
      setDataRequests(rRes.data || []);

      list.forEach((c) => {
        if (c.consent_type === 'analytics') setAnalyticsGranted(c.is_granted);
        if (c.consent_type === 'marketing') setMarketingGranted(c.is_granted);
        if (c.consent_type === 'third_party_sharing') setThirdPartyGranted(c.is_granted);
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConsentToggle = async (type: 'analytics' | 'marketing' | 'third_party_sharing', currentVal: boolean) => {
    const newVal = !currentVal;
    if (type === 'analytics') setAnalyticsGranted(newVal);
    if (type === 'marketing') setMarketingGranted(newVal);
    if (type === 'third_party_sharing') setThirdPartyGranted(newVal);

    try {
      await complianceApi.updateConsent({ consent_type: type, is_granted: newVal });
      setSuccessMsg(`Privacy consent for "${type}" updated successfully.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestExport = async () => {
    try {
      const res = await complianceApi.requestDataExport();
      setSuccessMsg('GDPR Data Export package generated! Download link is ready below.');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmAccountDeletion = async () => {
    try {
      await complianceApi.requestAccountDeletion();
      setOpenDeleteModal(false);
      setSuccessMsg('Account Deletion request submitted under GDPR Right to be Forgotten. Scheduled for 30-day SLA purge.');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100vh', color: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: '#38bdf8', p: 1.5, borderRadius: 2, color: '#0f172a', display: 'flex' }}>
              <LockIcon fontSize="large" />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(90deg, #38bdf8 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Kirmya Privacy Center & Compliance Portal
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                GDPR & CCPA Subject Access Requests, Data Export, Consent Controls, & Right to be Forgotten
              </Typography>
            </Box>
          </Box>

          <Chip icon={<ShieldIcon />} label="GDPR & CCPA COMPLIANT" color="success" sx={{ fontWeight: 'bold' }} />
        </Box>

        {successMsg && (
          <Alert severity="success" onClose={() => setSuccessMsg(null)} sx={{ mb: 3, bgcolor: '#064e3b', color: '#6ee7b7' }}>
            {successMsg}
          </Alert>
        )}

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />}

        <Grid container spacing={3}>
          {/* Left Column: Consent Management Controls */}
          <Grid item xs={12} md={7}>
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5, mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <CookieIcon sx={{ color: '#38bdf8' }} />
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc' }}>
                    Privacy Consent & Data Processing Permissions
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
                  Manage how your personal data is collected and processed across Kirmya enterprise services.
                </Typography>

                <List sx={{ width: '100%' }}>
                  <ListItem sx={{ bgcolor: '#0f172a', borderRadius: 2, mb: 1.5, border: '1px solid #334155' }}>
                    <ListItemIcon><CheckCircleIcon sx={{ color: '#10b981' }} /></ListItemIcon>
                    <ListItemText
                      primary={<Typography fontWeight="bold" color="#fff">Strictly Necessary Cookies & Core Auth</Typography>}
                      secondary={<Typography variant="body2" color="#94a3b8">Required for user authentication, security, and session management. Cannot be disabled.</Typography>}
                    />
                    <Chip label="ALWAYS ACTIVE" size="small" sx={{ bgcolor: '#10b981', color: '#0f172a', fontWeight: 'bold' }} />
                  </ListItem>

                  <ListItem sx={{ bgcolor: '#0f172a', borderRadius: 2, mb: 1.5, border: '1px solid #334155' }}>
                    <ListItemText
                      primary={<Typography fontWeight="bold" color="#fff">Performance & Platform Analytics</Typography>}
                      secondary={<Typography variant="body2" color="#94a3b8">Allows us to analyze platform usage and optimize Go backend microservice latency.</Typography>}
                    />
                    <FormControlLabel
                      control={<Switch checked={analyticsGranted} onChange={() => handleConsentToggle('analytics', analyticsGranted)} color="primary" />}
                      label=""
                    />
                  </ListItem>

                  <ListItem sx={{ bgcolor: '#0f172a', borderRadius: 2, mb: 1.5, border: '1px solid #334155' }}>
                    <ListItemText
                      primary={<Typography fontWeight="bold" color="#fff">Recruiter Job Recommendations & Email Alerts</Typography>}
                      secondary={<Typography variant="body2" color="#94a3b8">Receive personalized AI job match recommendations and recruiter outreach emails.</Typography>}
                    />
                    <FormControlLabel
                      control={<Switch checked={marketingGranted} onChange={() => handleConsentToggle('marketing', marketingGranted)} color="primary" />}
                      label=""
                    />
                  </ListItem>

                  <ListItem sx={{ bgcolor: '#0f172a', borderRadius: 2, border: '1px solid #334155' }}>
                    <ListItemText
                      primary={<Typography fontWeight="bold" color="#fff">Third-Party Training Provider Sharing</Typography>}
                      secondary={<Typography variant="body2" color="#94a3b8">Share anonymous skill gap analytics with verified enterprise training providers.</Typography>}
                    />
                    <FormControlLabel
                      control={<Switch checked={thirdPartyGranted} onChange={() => handleConsentToggle('third_party_sharing', thirdPartyGranted)} color="primary" />}
                      label=""
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>

            {/* Subject Access Requests (SAR) History */}
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 2 }}>
                  Data Access & Request History
                </Typography>

                {dataRequests.map((req) => (
                  <Box key={req.id} sx={{ bgcolor: '#0f172a', p: 2, borderRadius: 2, mb: 1.5, border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#38bdf8' }}>
                        {req.request_type === 'data_export' ? 'GDPR Subject Access Data Export' : 'Right to be Forgotten Deletion'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                        Requested: {new Date(req.requested_at).toLocaleDateString()}
                      </Typography>
                    </Box>

                    {req.download_url ? (
                      <Button variant="contained" size="small" startIcon={<DownloadIcon />} href={req.download_url} sx={{ bgcolor: '#10b981', color: '#0f172a', fontWeight: 'bold' }}>
                        Download JSON Package
                      </Button>
                    ) : (
                      <Chip label={req.status.toUpperCase()} color="warning" size="small" sx={{ fontWeight: 'bold' }} />
                    )}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Data Portability & Account Deletion */}
          <Grid item xs={12} md={5}>
            {/* Download Data Package Card */}
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #38bdf8', borderRadius: 2.5, mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <DownloadIcon sx={{ color: '#38bdf8' }} />
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc' }}>
                    Download Your Data (Right to Access)
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3, lineHeight: 1.6 }}>
                  Download a complete structured JSON archive containing your profile details, submitted job applications, resume documents, messaging history, and privacy audit logs under GDPR Article 15.
                </Typography>

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<DownloadIcon />}
                  onClick={handleRequestExport}
                  sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', py: 1.2 }}
                >
                  Generate Data Export Archive
                </Button>
              </CardContent>
            </Card>

            {/* Right to be Forgotten (Account Deletion) Card */}
            <Card sx={{ bgcolor: '#1e293b', border: '1px solid #f43f5e', borderRadius: 2.5 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <DeleteForeverIcon sx={{ color: '#f43f5e' }} />
                  <Typography variant="h6" fontWeight="bold" sx={{ color: '#f43f5e' }}>
                    Delete Account (Right to be Forgotten)
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3, lineHeight: 1.6 }}>
                  Permanently erase your Kirmya account, candidate profile, application history, and uploaded resumes under GDPR Article 17. This action is permanent and irreversible.
                </Typography>

                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  startIcon={<DeleteForeverIcon />}
                  onClick={() => setOpenDeleteModal(true)}
                  sx={{ fontWeight: 'bold', py: 1.2 }}
                >
                  Request Permanent Account Deletion
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Account Deletion Confirmation Modal */}
        <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1e293b', color: '#fff', border: '1px solid #f43f5e' } }}>
          <DialogTitle sx={{ fontWeight: 'bold', color: '#f43f5e' }}>
            Confirm Right to be Forgotten Account Deletion
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1, lineHeight: 1.6 }}>
              Are you sure you want to request permanent account deletion? Under GDPR SLA, your account and all associated personal data will be completely purged from database tables and CDN storage within 30 days.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setOpenDeleteModal(false)} sx={{ color: '#94a3b8' }}>Cancel</Button>
            <Button onClick={handleConfirmAccountDeletion} variant="contained" color="error" sx={{ fontWeight: 'bold' }}>
              Confirm Account Deletion
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

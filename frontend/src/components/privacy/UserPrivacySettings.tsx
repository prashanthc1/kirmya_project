'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Stack,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import PrivacyTipIcon from '@mui/icons-material/PrivacyTip';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import SecurityIcon from '@mui/icons-material/Security';
import SendIcon from '@mui/icons-material/Send';
import { DataSubjectRequestItem } from '@/features/privacy/types';
import { privacyApi } from '@/features/privacy/services/privacyApi';

export const UserPrivacySettings: React.FC = () => {
  // Consent toggles
  const [analyticsConsent, setAnalyticsConsent] = useState(true);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [aiTrainingConsent, setAiTrainingConsent] = useState(true);
  const [personalizationConsent, setPersonalizationConsent] = useState(true);
  const [consentSaved, setConsentSaved] = useState(false);

  // User DSAR History & Submission Form
  const [requests, setRequests] = useState<DataSubjectRequestItem[]>([]);
  const [openRequestModal, setOpenRequestModal] = useState(false);
  const [requestType, setRequestType] = useState<DataSubjectRequestItem['requestType']>('export');
  const [requestNotes, setRequestNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    loadUserRequests();
  }, []);

  const loadUserRequests = async () => {
    const data = await privacyApi.getDataSubjectRequests();
    setRequests(data);
  };

  const handleSaveConsent = () => {
    setConsentSaved(true);
    setTimeout(() => setConsentSaved(false), 3000);
  };

  const handleSubmitRequest = async () => {
    setSubmitting(true);
    const newReq = await privacyApi.createDataSubjectRequest({
      userId: 'current-user-id',
      userEmail: 'user@example.com',
      requestType,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: requestNotes,
    });
    setRequests((prev) => [newReq, ...prev]);
    setSubmitting(false);
    setSubmitSuccess(true);
    setOpenRequestModal(false);
    setRequestNotes('');
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <SecurityIcon sx={{ color: 'primary.main', fontSize: 36 }} />
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            User Privacy & Data Subject Rights Hub
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage your personal data consents, request data exports (GDPR Art. 20), or exercise account erasure rights.
          </Typography>
        </Box>
      </Stack>

      {consentSaved && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }}>
          Privacy preferences and data collection choices updated successfully!
        </Alert>
      )}

      {submitSuccess && (
        <Alert severity="success" onClose={() => setSubmitSuccess(false)} sx={{ mb: 3, borderRadius: '12px' }}>
          Your Data Subject Rights request has been logged. Our privacy desk will process it within compliance guidelines.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Consent Preferences Card */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 3,
              borderRadius: '24px',
              backdropFilter: 'blur(12px)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                Data Processing & Consent Preferences
              </Typography>

              <Stack spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={analyticsConsent}
                      onChange={(e) => setAnalyticsConsent(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Usage & Telemetry Analytics
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Allow anonymous usage statistics to help optimize product performance.
                      </Typography>
                    </Box>
                  }
                />
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

                <FormControlLabel
                  control={
                    <Switch
                      checked={marketingConsent}
                      onChange={(e) => setMarketingConsent(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Marketing & Product Updates
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Receive announcements regarding new compliance features and reports.
                      </Typography>
                    </Box>
                  }
                />
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

                <FormControlLabel
                  control={
                    <Switch
                      checked={aiTrainingConsent}
                      onChange={(e) => setAiTrainingConsent(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        AI Model Recommendation Training
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Allow anonymized data for improving career matching and skill extraction models.
                      </Typography>
                    </Box>
                  }
                />
                <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

                <FormControlLabel
                  control={
                    <Switch
                      checked={personalizationConsent}
                      onChange={(e) => setPersonalizationConsent(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Personalized Recommendations
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Tailor dashboard widgets and career insights based on user activity.
                      </Typography>
                    </Box>
                  }
                />
              </Stack>
            </Box>

            <Box sx={{ pt: 3 }}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleSaveConsent}
                sx={{ borderRadius: '12px', fontWeight: 700, py: 1.2 }}
              >
                Save Preferences
              </Button>
            </Box>
          </Card>
        </Grid>

        {/* Data Subject Rights Action Card */}
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              p: 3,
              borderRadius: '24px',
              backdropFilter: 'blur(12px)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
                Exercise Your Privacy Rights
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Under GDPR & CCPA regulations, you have full ownership of your data. You may request a complete export file or request account erasure.
              </Typography>

              <Stack spacing={2}>
                <Card
                  sx={{
                    p: 2,
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <DownloadIcon sx={{ color: 'primary.main' }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        Download My Personal Data
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Request a structured machine-readable JSON archive of your personal profile and logs.
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setRequestType('export');
                        setOpenRequestModal(true);
                      }}
                      sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                    >
                      Request Export
                    </Button>
                  </Stack>
                </Card>

                <Card
                  sx={{
                    p: 2,
                    borderRadius: '16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <DeleteForeverIcon sx={{ color: 'error.main' }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'error.main' }}>
                        Account & Data Erasure
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Permanently purge user profile, applications, and non-regulated retention records.
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => {
                        setRequestType('erasure');
                        setOpenRequestModal(true);
                      }}
                      sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                    >
                      Request Deletion
                    </Button>
                  </Stack>
                </Card>
              </Stack>
            </Box>

            <Box sx={{ pt: 3 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<PrivacyTipIcon />}
                onClick={() => setOpenRequestModal(true)}
                sx={{ borderRadius: '12px', fontWeight: 700, py: 1.2 }}
              >
                Submit Custom Privacy Request
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Request History */}
      <Card
        sx={{
          mt: 4,
          borderRadius: '24px',
          p: 3,
          backdropFilter: 'blur(12px)',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
          Your Active Privacy Requests History
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Request ID</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Submitted Date</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Fulfillment Due</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id} hover>
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{req.id}</TableCell>
                  <TableCell>
                    <Chip label={req.requestType.toUpperCase()} size="small" variant="outlined" color="primary" />
                  </TableCell>
                  <TableCell>{new Date(req.submittedAt).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(req.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip
                      label={req.status.replace('_', ' ').toUpperCase()}
                      color={
                        req.status === 'completed'
                          ? 'success'
                          : req.status === 'pending'
                          ? 'warning'
                          : 'info'
                      }
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">No active privacy requests found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Submission Modal */}
      <Dialog open={openRequestModal} onClose={() => setOpenRequestModal(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Submit Data Subject Rights Request</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Request Type</InputLabel>
              <Select
                value={requestType}
                label="Request Type"
                onChange={(e) => setRequestType(e.target.value as DataSubjectRequestItem['requestType'])}
              >
                <MenuItem value="export">Data Export (GDPR Art. 20)</MenuItem>
                <MenuItem value="access">Access Request (GDPR Art. 15 / CCPA)</MenuItem>
                <MenuItem value="erasure">Erasure / Deletion (GDPR Art. 17)</MenuItem>
                <MenuItem value="rectification">Rectification (GDPR Art. 16)</MenuItem>
                <MenuItem value="restriction">Restriction of Processing (Art. 18)</MenuItem>
                <MenuItem value="portability">Data Portability (Art. 20)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Additional Notes / Scope Instructions"
              multiline
              rows={3}
              value={requestNotes}
              onChange={(e) => setRequestNotes(e.target.value)}
              placeholder="Specify specific datasets or questions for our data protection team..."
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRequestModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSubmitRequest}
            disabled={submitting}
            sx={{ fontWeight: 700 }}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserPrivacySettings;

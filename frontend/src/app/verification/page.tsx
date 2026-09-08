'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  Chip,
  LinearProgress,
  Divider,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import ShieldIcon from '@mui/icons-material/Shield';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';
import BusinessIcon from '@mui/icons-material/Business';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { verificationApi } from '../../features/verification/api';
import {
  VerificationRequest,
  VerificationStatus,
  PrivacySetting,
  VerificationType,
} from '../../features/verification/types';
import { useSearchParams } from 'next/navigation';
import AuthLayout from '../../components/auth/AuthLayout';
import AuthCard from '../../components/auth/AuthCard';
import EmailVerificationView from '../../components/auth/EmailVerificationView';

function VerificationHubContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  if (token || emailParam) {
    return (
      <AuthLayout>
        <AuthCard>
          <EmailVerificationView />
        </AuthCard>
      </AuthLayout>
    );
  }

  return <VerificationDashboardContent />;
}

function VerificationDashboardContent() {
  const [activeTab, setActiveTab] = useState(0);
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form states for creating verification requests
  const [workEmail, setWorkEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [skillTitle, setSkillTitle] = useState('');
  const [certTitle, setCertTitle] = useState('');
  const [certOrg, setCertOrg] = useState('');
  const [certID, setCertID] = useState('');
  const [certURL, setCertURL] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resStatus, resRequests] = await Promise.allSettled([
        verificationApi.getStatus(),
        verificationApi.getUserRequests(),
      ]);

      // An unverified account is unverified. This used to show a verified
      // identity badge and a list of approved documents whenever the status
      // call failed.
      if (resStatus.status === 'fulfilled') {
        setStatus(resStatus.value ?? null);
      } else {
        setStatus(null);
        setLoadError('Could not load your verification status. Try again shortly.');
      }

      if (resRequests.status === 'fulfilled') {
        setRequests(resRequests.value?.data ?? []);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error(err);
      setStatus(null);
      setRequests([]);
      setLoadError('Could not load your verification status. Try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdatePrivacy = async (newSetting: PrivacySetting, hideDocs: boolean) => {
    try {
      setLoading(true);
      const res = await verificationApi.updatePrivacy({
        privacy_setting: newSetting,
        hide_sensitive_docs: hideDocs,
      });
      setStatus(res.status);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVerification = async (type: VerificationType, title: string, org?: string, credID?: string, url?: string, email?: string) => {
    try {
      setLoading(true);
      await verificationApi.createRequest({
        verification_type: type,
        title,
        organization_name: org,
        credential_id: credID,
        verification_url: url,
        work_email: email,
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  // An account with no verification record yet is Unverified with a zero trust
  // score. The fallback this replaces claimed a "Verified Professional" badge
  // and a trust score the server had never issued.
  const currentStatus: VerificationStatus = status ?? {
    id: '',
    user_id: '',
    trust_score: 0,
    badge_level: 'Unverified',
    email_verified: false,
    employment_verified: false,
    skills_verified: false,
    certifications_verified: false,
    privacy_setting: 'private',
    hide_sensitive_docs: true,
    created_at: '',
    updated_at: '',
  };

  return (
    <Box sx={{ bgcolor: '#090d16', minHeight: '100dvh', color: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Title Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(90deg, #38bdf8 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Professional Verification Center
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Increase recruiter trust through verified email, employment, skill badges, and credentials with granular privacy controls.
            </Typography>
          </Box>
        </Box>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />}

        {/* Top KPI: Trust Score & Privacy Controls Bar */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Trust Score Card */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress variant="determinate" value={100} size={76} thickness={4} sx={{ color: '#0f172a' }} />
                  <CircularProgress variant="determinate" value={currentStatus.trust_score} size={76} thickness={4} sx={{ color: '#10b981', position: 'absolute', left: 0 }} />
                  <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#10b981' }}>{currentStatus.trust_score}</Typography>
                  </Box>
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShieldIcon sx={{ color: '#10b981' }} />
                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc' }}>
                      Candidate Trust Score
                    </Typography>
                  </Box>
                  <Chip
                    label={currentStatus.badge_level}
                    size="small"
                    icon={<VerifiedIcon sx={{ color: '#0f172a !important' }} />}
                    sx={{ bgcolor: '#10b981', color: '#0f172a', fontWeight: 'bold', mt: 0.5 }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {currentStatus.email_verified && <Chip label="Email ✓" size="small" sx={{ bgcolor: '#0f172a', color: '#38bdf8', border: '1px solid #334155' }} />}
                {currentStatus.employment_verified && <Chip label="Work ✓" size="small" sx={{ bgcolor: '#0f172a', color: '#10b981', border: '1px solid #334155' }} />}
                {currentStatus.skills_verified && <Chip label="Skill ✓" size="small" sx={{ bgcolor: '#0f172a', color: '#a855f7', border: '1px solid #334155' }} />}
              </Box>
            </Paper>
          </Grid>

          {/* Privacy Controls Panel */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <LockIcon sx={{ color: '#f59e0b' }} />
                <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#f8fafc' }}>
                  Candidate Privacy Controls
                </Typography>
              </Box>

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>Visibility Audience:</Typography>
                  <Select
                    value={currentStatus.privacy_setting}
                    size="small"
                    fullWidth
                    onChange={(e) => handleUpdatePrivacy(e.target.value as PrivacySetting, currentStatus.hide_sensitive_docs)}
                    sx={{ color: '#fff', bgcolor: '#0f172a', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}
                  >
                    <MenuItem value="public">Public (Everyone)</MenuItem>
                    <MenuItem value="recruiters_only">Verified Recruiters Only</MenuItem>
                    <MenuItem value="private">Private (Only Me)</MenuItem>
                  </Select>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={currentStatus.hide_sensitive_docs}
                        onChange={(e) => handleUpdatePrivacy(currentStatus.privacy_setting, e.target.checked)}
                        color="primary"
                      />
                    }
                    label={<Typography variant="body2" sx={{ color: '#cbd5e1' }}>Redact Proof Documents</Typography>}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* Tab Navigation */}
        <Paper sx={{ mb: 3, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 1.5 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              '& .MuiTabs-indicator': { bgcolor: '#38bdf8' },
              '& .MuiTab-root': { color: '#94a3b8', fontWeight: 'bold', textTransform: 'none' },
              '& .Mui-selected': { color: '#38bdf8' },
            }}
          >
            <Tab icon={<EmailIcon fontSize="small" />} iconPosition="start" label="Work Email Verification" />
            <Tab icon={<BusinessIcon fontSize="small" />} iconPosition="start" label="Employment Verification" />
            <Tab icon={<WorkspacePremiumIcon fontSize="small" />} iconPosition="start" label="Skill Verification" />
            <Tab icon={<SchoolIcon fontSize="small" />} iconPosition="start" label="Certifications & Licensing" />
          </Tabs>
        </Paper>

        <Grid container spacing={3}>
          {/* Submission Form Panel */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #334155' }}>
              {activeTab === 0 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8', mb: 2 }}>
                    Verify Work Email Domain
                  </Typography>
                  <TextField
                    label="Corporate Work Email"
                    fullWidth
                    size="small"
                    value={workEmail}
                    onChange={(e) => setWorkEmail(e.target.value)}
                    sx={{ mb: 2, input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleCreateVerification('email', 'Work Email Verification', 'Corporate Email', undefined, undefined, workEmail)}
                    startIcon={<EmailIcon />}
                    sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}
                  >
                    Submit Email Verification
                  </Button>
                </Box>
              )}

              {activeTab === 1 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8', mb: 2 }}>
                    Verify Employment History
                  </Typography>
                  <TextField
                    label="Company Name"
                    fullWidth
                    size="small"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    sx={{ mb: 2, input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                  />
                  <TextField
                    label="Job Title / Role"
                    fullWidth
                    size="small"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    sx={{ mb: 2, input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleCreateVerification('employment', jobTitle, companyName)}
                    startIcon={<BusinessIcon />}
                    sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}
                  >
                    Submit Employment Verification
                  </Button>
                </Box>
              )}

              {activeTab === 2 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8', mb: 2 }}>
                    Verify Technical Skill Competency
                  </Typography>
                  <TextField
                    label="Skill Area / Assessment Title"
                    fullWidth
                    size="small"
                    value={skillTitle}
                    onChange={(e) => setSkillTitle(e.target.value)}
                    sx={{ mb: 2, input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleCreateVerification('skill', skillTitle, 'Kirmya Assessment Engine')}
                    startIcon={<WorkspacePremiumIcon />}
                    sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}
                  >
                    Link & Verify Skill Badge
                  </Button>
                </Box>
              )}

              {activeTab === 3 && (
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8', mb: 2 }}>
                    Verify Certification Credentials
                  </Typography>
                  <TextField
                    label="Certification Name"
                    fullWidth
                    size="small"
                    value={certTitle}
                    onChange={(e) => setCertTitle(e.target.value)}
                    sx={{ mb: 2, input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                  />
                  <TextField
                    label="Issuing Organization"
                    fullWidth
                    size="small"
                    value={certOrg}
                    onChange={(e) => setCertOrg(e.target.value)}
                    sx={{ mb: 2, input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                  />
                  <TextField
                    label="Credential ID"
                    fullWidth
                    size="small"
                    value={certID}
                    onChange={(e) => setCertID(e.target.value)}
                    sx={{ mb: 2, input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                  />
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => handleCreateVerification('certification', certTitle, certOrg, certID, certURL)}
                    startIcon={<SchoolIcon />}
                    sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}
                  >
                    Submit Certification Credential
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Verification Audit Feed Panel */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #334155', minHeight: 400 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#38bdf8', mb: 2 }}>
                Verified Credentials & Requests ({requests.length})
              </Typography>
              <Divider sx={{ borderColor: '#334155', mb: 2 }} />

              <Grid container spacing={2}>
                {requests.map((req) => (
                  <Grid item xs={12} key={req.id}>
                    <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2 }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc' }}>
                            {req.title}
                          </Typography>
                          <Chip
                            label={req.status.toUpperCase()}
                            size="small"
                            icon={<CheckCircleIcon sx={{ color: '#fff !important' }} />}
                            sx={{ bgcolor: '#22c55e', color: '#fff', fontWeight: 'bold' }}
                          />
                        </Box>

                        {req.organization_name && (
                          <Typography variant="body2" sx={{ color: '#38bdf8', mb: 1 }}>
                            Organization: {req.organization_name}
                          </Typography>
                        )}

                        {req.reviewer_notes && (
                          <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', bgcolor: '#0f172a', p: 1.5, borderRadius: 1 }}>
                            Reviewer Audit Note: {req.reviewer_notes}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default function VerificationPage() {
  return (
    <React.Suspense fallback={null}>
      <VerificationHubContent />
    </React.Suspense>
  );
}

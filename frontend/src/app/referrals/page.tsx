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
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import HandshakeIcon from '@mui/icons-material/Handshake';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PostAddIcon from '@mui/icons-material/PostAdd';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import SecurityIcon from '@mui/icons-material/Security';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SendIcon from '@mui/icons-material/Send';

import { referralApi } from '../../features/referral/api';
import {
  ReferralRequest,
  Referral,
  ReferralStatus,
} from '../../features/referral/types';

export default function ReferralsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [openRequests, setOpenRequests] = useState<ReferralRequest[]>([]);
  const [myReferrals, setMyReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(false);

  // Offer Modal State
  const [selectedRequest, setSelectedRequest] = useState<ReferralRequest | null>(null);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [referrerCompany, setReferrerCompany] = useState('');
  const [referrerJobTitle, setReferrerJobTitle] = useState('Staff Engineer');
  const [referrerEmail, setReferrerEmail] = useState('insider@company.com');

  // Request Form State
  const [reqCompany, setReqCompany] = useState('Stripe Global');
  const [reqJobTitle, setReqJobTitle] = useState('Senior Full-Stack Engineer');
  const [reqJobUrl, setReqJobUrl] = useState('https://stripe.com/jobs/123');
  const [reqResume, setReqResume] = useState('https://kirmya.dev/resume/alex');
  const [reqMsg, setReqMsg] = useState(
    'Hi! I have 5+ years of experience building high-scale Go microservices and React web apps. Would love an internal referral for this open position!'
  );

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resOpen, resMy] = await Promise.allSettled([
        referralApi.getOpenRequests(),
        referralApi.getUserReferrals(),
      ]);

      if (resOpen.status === 'fulfilled') {
        setOpenRequests(resOpen.value?.data ?? []);
      } else {
        setOpenRequests([]);
      }

      if (resMy.status === 'fulfilled') {
        setMyReferrals(resMy.value?.data ?? []);
      } else {
        setMyReferrals([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRequest = async () => {
    try {
      setLoading(true);
      await referralApi.createRequest({
        company_name: reqCompany,
        job_title: reqJobTitle,
        target_job_url: reqJobUrl,
        resume_link: reqResume,
        message_to_referrer: reqMsg,
      });
      await fetchData();
      setActiveTab(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOfferModal = (req: ReferralRequest) => {
    setSelectedRequest(req);
    setReferrerCompany(req.company_name);
    setOfferModalOpen(true);
  };

  const handleSubmitOffer = async () => {
    if (!selectedRequest) return;
    try {
      setLoading(true);
      await referralApi.offerReferral({
        request_id: selectedRequest.id,
        referrer_name: 'Verified Employee Insider',
        referrer_company: referrerCompany,
        referrer_job_title: referrerJobTitle,
        referrer_email: referrerEmail,
      });
      setOfferModalOpen(false);
      await fetchData();
      setActiveTab(2);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: ReferralStatus) => {
    try {
      setLoading(true);
      await referralApi.updateReferralStatus(id, {
        status: newStatus,
        notes: `Status updated to ${newStatus} by user action.`,
      });
      await fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };



  const getStepIndex = (status: ReferralStatus) => {
    switch (status) {
      case 'pending_accept':
        return 0;
      case 'accepted':
        return 1;
      case 'submitted_to_ats':
        return 2;
      case 'interviewing':
        return 3;
      case 'hired':
        return 4;
      default:
        return 0;
    }
  };

  const steps = ['Offer Received', 'Match Confirmed', 'Submitted to Company ATS', 'Interviewing', 'Job Offer / Hired'];

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100dvh', color: 'text.primary', py: 4 }}>
      <Container maxWidth="xl">
        {/* Title Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{    }}>
              Kirmya Internal Referral Network & Marketplace
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Connect unemployed professionals directly with employee insiders at top target companies for internal job referrals.
            </Typography>
          </Box>

          {/* Privacy Protection Badge */}
          <Paper sx={{ p: 1.5, px: 2, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SecurityIcon sx={{ color: 'primary.main' }} />
            <Box>
              <Typography variant="caption" fontWeight="bold" sx={{ color: 'primary.main', display: 'block' }}>
                Privacy Shield Active
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Contact emails & resume links masked until match is accepted
              </Typography>
            </Box>
          </Paper>
        </Box>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: 'background.paper', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }} />}

        {/* Tab Navigation */}
        <Paper sx={{ mb: 3, bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 1.5 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              '& .MuiTabs-indicator': { bgcolor: 'primary.main' },
              '& .MuiTab-root': { color: 'text.secondary', fontWeight: 'bold', textTransform: 'none' },
              '& .Mui-selected': { color: 'primary.main' },
            }}
          >
            <Tab icon={<StorefrontIcon fontSize="small" />} iconPosition="start" label="Referral Marketplace Feed" />
            <Tab icon={<PostAddIcon fontSize="small" />} iconPosition="start" label="Request an Internal Referral" />
            <Tab icon={<TrackChangesIcon fontSize="small" />} iconPosition="start" label="Active Referrals & Lifecycle Stepper" />
          </Tabs>
        </Paper>

        {/* Tab 0: Referral Marketplace Feed */}
        {activeTab === 0 && (
          <Grid container spacing={3}>
            {openRequests.map((req) => (
              <Grid item xs={12} md={6} key={req.id}>
                <Card sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Chip
                        icon={<BusinessIcon sx={{ color: 'primary.main' }} />}
                        label={req.company_name}
                        size="small"
                        sx={{ bgcolor: 'background.default', color: 'primary.main', border: 1, borderColor: 'divider', fontWeight: 'bold' }}
                      />
                      <Chip label="OPEN REQUEST" size="small" sx={{ bgcolor: 'success.main', color: 'success.contrastText', fontWeight: 'bold' }} />
                    </Box>

                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary', mb: 1 }}>
                      {req.job_title}
                    </Typography>

                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, flexGrow: 1 }}>
                      &quot;{req.message_to_referrer}&quot;
                    </Typography>

                    <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2, display: 'block' }}>
                      Requested by {req.candidate_name} • Posted on {new Date(req.created_at).toLocaleDateString()}
                    </Typography>

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handleOpenOfferModal(req)}
                      startIcon={<HandshakeIcon />}
                      sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold', py: 1, '&:hover': { bgcolor: 'primary.main' } }}
                    >
                      Offer Internal Referral
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Tab 1: Request an Internal Referral Studio */}
        {activeTab === 1 && (
          <Paper sx={{ p: 4, bgcolor: 'background.default', border: 1, borderColor: 'divider', maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'primary.main', mb: 2 }}>
              Create Internal Referral Request
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Post your target job opening to the Kirmya marketplace. Verified employee insiders working at your target company will review your profile and submit your referral directly to their ATS.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Target Company Name"
                  fullWidth
                  size="small"
                  value={reqCompany}
                  onChange={(e) => setReqCompany(e.target.value)}
                  sx={{ input: { color: 'text.primary' }, label: { color: 'text.secondary' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: 'divider' } } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Target Job Title"
                  fullWidth
                  size="small"
                  value={reqJobTitle}
                  onChange={(e) => setReqJobTitle(e.target.value)}
                  sx={{ input: { color: 'text.primary' }, label: { color: 'text.secondary' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: 'divider' } } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Job Posting URL (Optional)"
                  fullWidth
                  size="small"
                  value={reqJobUrl}
                  onChange={(e) => setReqJobUrl(e.target.value)}
                  sx={{ input: { color: 'text.primary' }, label: { color: 'text.secondary' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: 'divider' } } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Candidate Resume Link"
                  fullWidth
                  size="small"
                  value={reqResume}
                  onChange={(e) => setReqResume(e.target.value)}
                  sx={{ input: { color: 'text.primary' }, label: { color: 'text.secondary' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: 'divider' } } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Message to Employee Referrer"
                  multiline
                  rows={3}
                  fullWidth
                  size="small"
                  value={reqMsg}
                  onChange={(e) => setReqMsg(e.target.value)}
                  sx={{ textarea: { color: 'text.primary' }, label: { color: 'text.secondary' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: 'divider' } } }}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleCreateRequest}
                  startIcon={<SendIcon />}
                  sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold', py: 1.2, '&:hover': { bgcolor: 'primary.main' } }}
                >
                  Post Request to Marketplace
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Tab 2: Active Referrals & Lifecycle Stepper */}
        {activeTab === 2 && (
          <Paper sx={{ p: 3, bgcolor: 'background.default', border: 1, borderColor: 'divider' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: 'primary.main', mb: 2 }}>
              Active Referrals & Lifecycle Tracker ({myReferrals.length})
            </Typography>
            <Divider sx={{ borderColor: 'divider', mb: 3 }} />

            <Grid container spacing={3}>
              {myReferrals.map((ref) => (
                <Grid item xs={12} key={ref.id}>
                  <Card sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 2.5 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
                            Referral for {ref.referrer_company}
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'primary.main' }}>
                            Referrer: {ref.referrer_name} ({ref.referrer_job_title}) • Contact: {ref.referrer_email}
                          </Typography>
                        </Box>

                        <Chip
                          label={ref.status.replace('_', ' ').toUpperCase()}
                          size="small"
                          sx={{ bgcolor: 'success.main', color: 'success.contrastText', fontWeight: 'bold' }}
                        />
                      </Box>

                      {/* Visual Stepper */}
                      <Box sx={{ width: '100%', my: 3 }}>
                        <Stepper activeStep={getStepIndex(ref.status)} alternativeLabel>
                          {steps.map((label) => (
                            <Step key={label}>
                              <StepLabel sx={{ '& .MuiStepLabel-label': { color: 'text.secondary' }, '& .Mui-active': { color: 'primary.main' }, '& .Mui-completed': { color: 'success.main' } }}>
                                {label}
                              </StepLabel>
                            </Step>
                          ))}
                        </Stepper>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 2 }}>
                        {ref.status === 'pending_accept' && (
                          <Button size="small" variant="contained" onClick={() => handleUpdateStatus(ref.id, 'accepted')} startIcon={<CheckCircleIcon />} sx={{ bgcolor: 'success.main', color: 'success.contrastText', fontWeight: 'bold' }}>
                            Confirm & Accept Match
                          </Button>
                        )}
                        {ref.status === 'accepted' && (
                          <Button size="small" variant="contained" onClick={() => handleUpdateStatus(ref.id, 'submitted_to_ats')} sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
                            Mark Submitted to Company ATS
                          </Button>
                        )}
                        {ref.status === 'submitted_to_ats' && (
                          <Button size="small" variant="contained" onClick={() => handleUpdateStatus(ref.id, 'hired')} sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
                            Mark Hired / Offer Received
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* Offer Referral Modal */}
        <Dialog open={offerModalOpen} onClose={() => setOfferModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: 'background.paper', color: 'text.primary', fontWeight: 'bold' }}>
            Offer Internal Referral at {selectedRequest?.company_name}
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: 'background.default', color: 'text.primary', p: 3 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              You are offering an internal employee referral to {selectedRequest?.candidate_name} for {selectedRequest?.job_title}. Contact information is masked until both parties confirm match.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Your Company"
                  fullWidth
                  size="small"
                  value={referrerCompany}
                  onChange={(e) => setReferrerCompany(e.target.value)}
                  sx={{ input: { color: 'text.primary' }, label: { color: 'text.secondary' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: 'divider' } } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Your Job Title at Company"
                  fullWidth
                  size="small"
                  value={referrerJobTitle}
                  onChange={(e) => setReferrerJobTitle(e.target.value)}
                  sx={{ input: { color: 'text.primary' }, label: { color: 'text.secondary' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: 'divider' } } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Your Work Email (Masked until confirmed)"
                  fullWidth
                  size="small"
                  value={referrerEmail}
                  onChange={(e) => setReferrerEmail(e.target.value)}
                  sx={{ input: { color: 'text.primary' }, label: { color: 'text.secondary' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: 'divider' } } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: 'background.paper' }}>
            <Button onClick={() => setOfferModalOpen(false)} sx={{ color: 'text.secondary' }}>Cancel</Button>
            <Button onClick={handleSubmitOffer} variant="contained" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', fontWeight: 'bold' }}>
              Confirm & Offer Referral
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

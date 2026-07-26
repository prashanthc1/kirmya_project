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
        setOpenRequests(resOpen.value?.data || mockOpenRequests);
      } else {
        setOpenRequests(mockOpenRequests);
      }

      if (resMy.status === 'fulfilled') {
        setMyReferrals(resMy.value?.data || mockMyReferrals);
      } else {
        setMyReferrals(mockMyReferrals);
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

  const mockOpenRequests: ReferralRequest[] = [
    {
      id: 'req-101',
      candidate_id: 'cand-1',
      candidate_name: 'Alex Rivera',
      company_name: 'Stripe Global',
      job_title: 'Senior Full-Stack Engineer',
      target_job_url: 'https://stripe.com/jobs/123',
      resume_link: 'https://kirmya.dev/resume/alex',
      message_to_referrer: 'Seeking internal referral for Stripe Full-Stack position. 5+ years Go & React experience.',
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'req-102',
      candidate_id: 'cand-2',
      candidate_name: 'Jordan Lee',
      company_name: 'Google',
      job_title: 'Software Engineer - Distributed Systems',
      target_job_url: 'https://careers.google.com/jobs/456',
      resume_link: 'https://kirmya.dev/resume/jordan',
      message_to_referrer: 'Looking for a Googler to submit an internal referral for Cloud Infrastructure role.',
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const mockMyReferrals: Referral[] = [
    {
      id: 'ref-201',
      request_id: 'req-101',
      candidate_id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
      candidate_name: 'Alex Rivera',
      referrer_id: 'ref-user-1',
      referrer_name: 'David Chen',
      referrer_company: 'Stripe Global',
      referrer_job_title: 'Principal Architect',
      referrer_email: '[MASKED UNTIL MATCH CONFIRMED]',
      status: 'accepted',
      privacy_masked: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

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
    <Box sx={{ bgcolor: '#090d16', minHeight: '100vh', color: '#f8fafc', py: 4 }}>
      <Container maxWidth="xl">
        {/* Title Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ background: 'linear-gradient(90deg, #38bdf8 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Kirmya Internal Referral Network & Marketplace
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8' }}>
              Connect unemployed professionals directly with employee insiders at top target companies for internal job referrals.
            </Typography>
          </Box>

          {/* Privacy Protection Badge */}
          <Paper sx={{ p: 1.5, px: 2, bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <SecurityIcon sx={{ color: '#38bdf8' }} />
            <Box>
              <Typography variant="caption" fontWeight="bold" sx={{ color: '#38bdf8', display: 'block' }}>
                Privacy Shield Active
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                Contact emails & resume links masked until match is accepted
              </Typography>
            </Box>
          </Paper>
        </Box>

        {loading && <LinearProgress sx={{ mb: 3, bgcolor: '#1e293b', '& .MuiLinearProgress-bar': { bgcolor: '#38bdf8' } }} />}

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
                <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Chip
                        icon={<BusinessIcon sx={{ color: '#38bdf8 !important' }} />}
                        label={req.company_name}
                        size="small"
                        sx={{ bgcolor: '#0f172a', color: '#38bdf8', border: '1px solid #334155', fontWeight: 'bold' }}
                      />
                      <Chip label="OPEN REQUEST" size="small" sx={{ bgcolor: '#22c55e', color: '#fff', fontWeight: 'bold' }} />
                    </Box>

                    <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc', mb: 1 }}>
                      {req.job_title}
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2, flexGrow: 1 }}>
                      "{req.message_to_referrer}"
                    </Typography>

                    <Typography variant="caption" sx={{ color: '#64748b', mb: 2, display: 'block' }}>
                      Requested by {req.candidate_name} • Posted on {new Date(req.created_at).toLocaleDateString()}
                    </Typography>

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handleOpenOfferModal(req)}
                      startIcon={<HandshakeIcon />}
                      sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', py: 1, '&:hover': { bgcolor: '#0284c7' } }}
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
          <Paper sx={{ p: 4, bgcolor: '#0f172a', border: '1px solid #334155', maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#38bdf8', mb: 2 }}>
              Create Internal Referral Request
            </Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 3 }}>
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
                  sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Target Job Title"
                  fullWidth
                  size="small"
                  value={reqJobTitle}
                  onChange={(e) => setReqJobTitle(e.target.value)}
                  sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Job Posting URL (Optional)"
                  fullWidth
                  size="small"
                  value={reqJobUrl}
                  onChange={(e) => setReqJobUrl(e.target.value)}
                  sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Candidate Resume Link"
                  fullWidth
                  size="small"
                  value={reqResume}
                  onChange={(e) => setReqResume(e.target.value)}
                  sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
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
                  sx={{ textarea: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleCreateRequest}
                  startIcon={<SendIcon />}
                  sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold', py: 1.2, '&:hover': { bgcolor: '#0284c7' } }}
                >
                  Post Request to Marketplace
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Tab 2: Active Referrals & Lifecycle Stepper */}
        {activeTab === 2 && (
          <Paper sx={{ p: 3, bgcolor: '#0f172a', border: '1px solid #334155' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ color: '#38bdf8', mb: 2 }}>
              Active Referrals & Lifecycle Tracker ({myReferrals.length})
            </Typography>
            <Divider sx={{ borderColor: '#334155', mb: 3 }} />

            <Grid container spacing={3}>
              {myReferrals.map((ref) => (
                <Grid item xs={12} key={ref.id}>
                  <Card sx={{ bgcolor: '#1e293b', border: '1px solid #334155', borderRadius: 2.5 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: '#f8fafc' }}>
                            Referral for {ref.referrer_company}
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#38bdf8' }}>
                            Referrer: {ref.referrer_name} ({ref.referrer_job_title}) • Contact: {ref.referrer_email}
                          </Typography>
                        </Box>

                        <Chip
                          label={ref.status.replace('_', ' ').toUpperCase()}
                          size="small"
                          sx={{ bgcolor: '#10b981', color: '#0f172a', fontWeight: 'bold' }}
                        />
                      </Box>

                      {/* Visual Stepper */}
                      <Box sx={{ width: '100%', my: 3 }}>
                        <Stepper activeStep={getStepIndex(ref.status)} alternativeLabel>
                          {steps.map((label) => (
                            <Step key={label}>
                              <StepLabel sx={{ '& .MuiStepLabel-label': { color: '#94a3b8' }, '& .Mui-active': { color: '#38bdf8 !important' }, '& .Mui-completed': { color: '#10b981 !important' } }}>
                                {label}
                              </StepLabel>
                            </Step>
                          ))}
                        </Stepper>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 2 }}>
                        {ref.status === 'pending_accept' && (
                          <Button size="small" variant="contained" onClick={() => handleUpdateStatus(ref.id, 'accepted')} startIcon={<CheckCircleIcon />} sx={{ bgcolor: '#22c55e', color: '#fff', fontWeight: 'bold' }}>
                            Confirm & Accept Match
                          </Button>
                        )}
                        {ref.status === 'accepted' && (
                          <Button size="small" variant="contained" onClick={() => handleUpdateStatus(ref.id, 'submitted_to_ats')} sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}>
                            Mark Submitted to Company ATS
                          </Button>
                        )}
                        {ref.status === 'submitted_to_ats' && (
                          <Button size="small" variant="contained" onClick={() => handleUpdateStatus(ref.id, 'hired')} sx={{ bgcolor: '#a855f7', color: '#fff', fontWeight: 'bold' }}>
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
          <DialogTitle sx={{ bgcolor: '#1e293b', color: '#fff', fontWeight: 'bold' }}>
            Offer Internal Referral at {selectedRequest?.company_name}
          </DialogTitle>
          <DialogContent dividers sx={{ bgcolor: '#0f172a', color: '#f8fafc', p: 3 }}>
            <Typography variant="body2" sx={{ color: '#94a3b8', mb: 2 }}>
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
                  sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Your Job Title at Company"
                  fullWidth
                  size="small"
                  value={referrerJobTitle}
                  onChange={(e) => setReferrerJobTitle(e.target.value)}
                  sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Your Work Email (Masked until confirmed)"
                  fullWidth
                  size="small"
                  value={referrerEmail}
                  onChange={(e) => setReferrerEmail(e.target.value)}
                  sx={{ input: { color: '#fff' }, label: { color: '#94a3b8' }, '& .MuiOutlinedInput-root': { fieldset: { borderColor: '#334155' } } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: '#1e293b' }}>
            <Button onClick={() => setOfferModalOpen(false)} sx={{ color: '#94a3b8' }}>Cancel</Button>
            <Button onClick={handleSubmitOffer} variant="contained" sx={{ bgcolor: '#38bdf8', color: '#0f172a', fontWeight: 'bold' }}>
              Confirm & Offer Referral
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

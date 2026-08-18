'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Tabs,
  Tab,
  Button,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import BlockIcon from '@mui/icons-material/Block';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import GavelIcon from '@mui/icons-material/Gavel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import HistoryIcon from '@mui/icons-material/History';
import SendIcon from '@mui/icons-material/Send';
import { trustSafetyApi } from '../../features/trust_safety/services/trustSafetyApi';
import { SafetyReport, UserBlock, UserMute, UserRestriction } from '../../features/trust_safety/types';

export const UserSafetyCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [restrictions, setRestrictions] = useState<UserRestriction[]>([]);
  const [blocks, setBlocks] = useState<UserBlock[]>([]);
  const [mutes, setMutes] = useState<UserMute[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog States
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [appealModalOpen, setAppealModalOpen] = useState<UserRestriction | null>(null);
  const [blockModalOpen, setBlockModalOpen] = useState(false);

  // Report Form State
  const [reportTargetType, setReportTargetType] = useState('job');
  const [reportTargetId, setReportTargetId] = useState('');
  const [reportCategory, setReportCategory] = useState('fake_job');
  const [reportDescription, setReportDescription] = useState('');
  const [reportEvidenceUrl, setReportEvidenceUrl] = useState('');

  // Appeal Form State
  const [appealReason, setAppealReason] = useState('False Positive Flag');
  const [appealExplanation, setAppealExplanation] = useState('');

  // Block Form State
  const [blockUserId, setBlockUserId] = useState('');
  const [blockReason, setBlockReason] = useState('');

  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [reps, rst, blk, mut] = await Promise.all([
        trustSafetyApi.getUserReports(),
        trustSafetyApi.getUserRestrictions(),
        trustSafetyApi.getUserBlocks(),
        trustSafetyApi.getUserMutes(),
      ]);
      setReports(reps || []);
      setRestrictions(rst || []);
      setBlocks(blk || []);
      setMutes(mut || []);
    } catch {
      // fallback handled in API
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReportSubmit = async () => {
    await trustSafetyApi.submitReport({
      target_type: reportTargetType,
      target_id: reportTargetId || 'target-' + Date.now(),
      target_title: `Reported ${reportTargetType.toUpperCase()}`,
      category: reportCategory,
      description: reportDescription,
      evidence_urls: reportEvidenceUrl ? [reportEvidenceUrl] : [],
      reporter_privacy: true,
    });
    setStatusMsg('Confidential safety report submitted successfully. Our team will review within SLA guidelines.');
    setReportModalOpen(false);
    setReportDescription('');
    setReportEvidenceUrl('');
    loadData();
  };

  const handleAppealSubmit = async () => {
    if (!appealModalOpen) return;
    await trustSafetyApi.submitAppeal({
      decision_id: appealModalOpen.id,
      reason: appealReason,
      explanation: appealExplanation,
    });
    setStatusMsg('Appeal submitted successfully. Reviewer assigned.');
    setAppealModalOpen(null);
    setAppealExplanation('');
    loadData();
  };

  const handleBlockSubmit = async () => {
    if (!blockUserId) return;
    await trustSafetyApi.blockUser(blockUserId, blockReason);
    setStatusMsg(`User ${blockUserId} blocked successfully.`);
    setBlockModalOpen(false);
    setBlockUserId('');
    setBlockReason('');
    loadData();
  };

  const handleUnblock = async (blockedId: string) => {
    await trustSafetyApi.unblockUser(blockedId);
    setStatusMsg(`User ${blockedId} unblocked.`);
    loadData();
  };

  const handleUnmute = async (mutedId: string) => {
    await trustSafetyApi.unmuteUser(mutedId);
    setStatusMsg(`User ${mutedId} unmuted.`);
    loadData();
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, md: 4 } }}>
      {/* Top Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: '28px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.15) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Chip
              icon={<VerifiedUserIcon />}
              label="Kirmya Trust & Safety Center"
              color="primary"
              sx={{ fontWeight: 900, mb: 1.5, px: 1 }}
            />
            <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
              Proactive Fraud Prevention & Platform Integrity
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
              Kirmya maintains zero tolerance for recruitment scams, fake job postings, identity theft, and harassment.
              Manage your blocks, active account status, submitted reports, and appeals securely below.
            </Typography>
          </Grid>

          <Grid item xs={12} md={4} sx={{ textAlign: { md: 'right' } }}>
            <Button
              variant="contained"
              color="error"
              size="large"
              startIcon={<ReportProblemIcon />}
              onClick={() => setReportModalOpen(true)}
              sx={{ borderRadius: '16px', fontWeight: 900, py: 1.5, px: 3, boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)' }}
            >
              Report Abuse or Fraud
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {statusMsg && (
        <Alert severity="success" onClose={() => setStatusMsg(null)} sx={{ mb: 3, borderRadius: '14px' }}>
          {statusMsg}
        </Alert>
      )}

      {/* Main Hub Tabs */}
      <Tabs
        value={activeTab}
        onChange={(_, val) => setActiveTab(val)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Community Guidelines" icon={<VerifiedUserIcon />} iconPosition="start" sx={{ fontWeight: 800 }} />
        <Tab
          label={`Active Restrictions (${restrictions.filter((r) => r.status === 'active').length})`}
          icon={<GavelIcon />}
          iconPosition="start"
          sx={{ fontWeight: 800 }}
        />
        <Tab label={`Blocked & Muted (${blocks.length + mutes.length})`} icon={<BlockIcon />} iconPosition="start" sx={{ fontWeight: 800 }} />
        <Tab label={`My Submitted Reports (${reports.length})`} icon={<HistoryIcon />} iconPosition="start" sx={{ fontWeight: 800 }} />
      </Tabs>

      {/* Tab 0: Community Guidelines */}
      {activeTab === 0 && (
        <Stack spacing={2}>
          <Accordion defaultExpanded sx={{ borderRadius: '16px !important', overflow: 'hidden' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                1. Transparent & Fee-Free Recruitment Standard
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                No recruiter or employer on Kirmya may request advance payments, application fees, training deposits, or
                equipment purchases from job candidates. Any demand for wire transfers or gift cards triggers immediate
                permanent account termination.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ borderRadius: '16px !important', overflow: 'hidden' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                2. Identity Integrity & Corporate Verification
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Recruiters must register with verifiable corporate domain emails and authentic corporate identity. Impersonation of
                official hiring agencies or companies results in immediate server-side suspension.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ borderRadius: '16px !important', overflow: 'hidden' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                3. Respectful Direct Messaging & Anti-Spam
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Unsolicited mass outreach, harassment, off-platform redirect links, or offensive communication is strictly prohibited.
                Our AI engine automatically flags high-velocity spam messaging patterns.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion sx={{ borderRadius: '16px !important', overflow: 'hidden' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                4. Applicant Data Privacy Protection
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Candidate contact details and resumes submitted through job applications are confidential and cannot be sold, scraped,
                or re-distributed off-platform without explicit candidate consent.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Stack>
      )}

      {/* Tab 1: Active Restrictions */}
      {activeTab === 1 && (
        <Card sx={{ borderRadius: '24px', p: 3, background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(16px)' }}>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
            Account Status & Active Restrictions
          </Typography>

          {restrictions.length === 0 ? (
            <Alert severity="success" icon={<VerifiedUserIcon />} sx={{ borderRadius: '14px' }}>
              Your account is in good standing! No active enforcement restrictions or penalties.
            </Alert>
          ) : (
            <Stack spacing={2}>
              {restrictions.map((rst) => (
                <Paper key={rst.id} elevation={0} sx={{ p: 3, borderRadius: '16px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <Chip label={rst.status.toUpperCase()} color="error" size="small" sx={{ fontWeight: 900 }} />
                        <Typography variant="h6" sx={{ fontWeight: 800, color: 'error.main' }}>
                          {rst.restriction_type}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                        Reason: {rst.reason}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Expires At: {rst.expires_at ? new Date(rst.expires_at).toLocaleString() : 'Permanent until appeal'}
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setAppealModalOpen(rst)}
                      sx={{ borderRadius: '12px', fontWeight: 900 }}
                    >
                      File Decision Appeal
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Card>
      )}

      {/* Tab 2: Blocked & Muted */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          {/* Block List */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: '24px', p: 3, background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(16px)' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BlockIcon color="error" /> Blocked Accounts ({blocks.length})
                </Typography>
                <Button variant="outlined" size="small" onClick={() => setBlockModalOpen(true)} sx={{ borderRadius: '8px', fontWeight: 800 }}>
                  Block User
                </Button>
              </Stack>
              <Stack spacing={1.5}>
                {blocks.map((blk) => (
                  <Paper key={blk.id} elevation={0} sx={{ p: 2, borderRadius: '12px', background: 'rgba(0,0,0,0.03)' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          {blk.blocked_name || blk.blocked_id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {blk.reason || 'Blocked account'}
                        </Typography>
                      </Box>
                      <Button size="small" color="error" onClick={() => handleUnblock(blk.blocked_id)}>
                        Unblock
                      </Button>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Card>
          </Grid>

          {/* Mute List */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: '24px', p: 3, background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(16px)' }}>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <VolumeOffIcon color="action" /> Muted Feeds & Users ({mutes.length})
              </Typography>
              <Stack spacing={1.5}>
                {mutes.map((mut) => (
                  <Paper key={mut.id} elevation={0} sx={{ p: 2, borderRadius: '12px', background: 'rgba(0,0,0,0.03)' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                          {mut.muted_name || mut.muted_id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {mut.reason || 'Muted user feed'}
                        </Typography>
                      </Box>
                      <Button size="small" onClick={() => handleUnmute(mut.muted_id)}>
                        Unmute
                      </Button>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tab 3: Report History */}
      {activeTab === 3 && (
        <Card sx={{ borderRadius: '24px', p: 3, background: 'rgba(255, 255, 255, 0.05)', backdropFilter: 'blur(16px)' }}>
          <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
            My Submitted Confidential Reports
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900 }}>Report ID / Target</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((rep) => (
                  <TableRow key={rep.id}>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, fontFamily: 'monospace' }}>
                        {rep.id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {rep.target_title || rep.target_id} ({rep.target_type.toUpperCase()})
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={rep.category.toUpperCase().replace('_', ' ')} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{rep.description}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={rep.status.toUpperCase()} color="info" size="small" sx={{ fontWeight: 800 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(rep.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Submit Report Dialog */}
      <Dialog
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ style: { borderRadius: 24, backdropFilter: 'blur(20px)', background: 'rgba(255, 255, 255, 0.95)' } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Submit Confidential Safety Report</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <FormControl fullWidth>
              <InputLabel>Target Entity Type</InputLabel>
              <Select value={reportTargetType} label="Target Entity Type" onChange={(e) => setReportTargetType(e.target.value)}>
                <MenuItem value="job">Job Posting / Opportunity</MenuItem>
                <MenuItem value="user">User Account / Recruiter</MenuItem>
                <MenuItem value="company">Company Profile</MenuItem>
                <MenuItem value="post">Community Post / Comment</MenuItem>
                <MenuItem value="message">Direct Message</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Target Reference / ID (Optional)"
              value={reportTargetId}
              onChange={(e) => setReportTargetId(e.target.value)}
              placeholder="e.g. job-102 or recruiter-name"
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Report Category / Violation Reason</InputLabel>
              <Select value={reportCategory} label="Report Category / Violation Reason" onChange={(e) => setReportCategory(e.target.value)}>
                <MenuItem value="fake_job">Fake Job / Advance Fee Demand</MenuItem>
                <MenuItem value="impersonation">Identity Impersonation</MenuItem>
                <MenuItem value="spam">Unsolicited Spam / Commercial Messaging</MenuItem>
                <MenuItem value="harassment">Harassment or Abuse</MenuItem>
                <MenuItem value="privacy_violation">Privacy / Data Misuse</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Detailed Explanation of Violation"
              multiline
              rows={4}
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
              placeholder="Describe what occurred, including message text, payment requests, or links..."
              fullWidth
            />

            <TextField
              label="Evidence Screenshot / Document URL"
              value={reportEvidenceUrl}
              onChange={(e) => setReportEvidenceUrl(e.target.value)}
              placeholder="https://example.com/evidence-link"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setReportModalOpen(false)} sx={{ fontWeight: 800 }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleReportSubmit} startIcon={<SendIcon />} sx={{ borderRadius: '12px', fontWeight: 900 }}>
            Submit Confidential Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit Appeal Dialog */}
      <Dialog
        open={Boolean(appealModalOpen)}
        onClose={() => setAppealModalOpen(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ style: { borderRadius: 24, backdropFilter: 'blur(20px)', background: 'rgba(255, 255, 255, 0.95)' } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Submit Moderation Decision Appeal</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Alert severity="warning" sx={{ borderRadius: '12px' }}>
              Appealing decision for restriction: <strong>{appealModalOpen?.restriction_type}</strong>
            </Alert>

            <TextField
              label="Enforcement Decision Reference ID"
              value={appealModalOpen?.id || ''}
              disabled
              fullWidth
            />

            <TextField
              label="Dispute Rationale Reason"
              value={appealReason}
              onChange={(e) => setAppealReason(e.target.value)}
              fullWidth
            />

            <TextField
              label="Detailed Explanation & Counter Evidence"
              multiline
              rows={4}
              value={appealExplanation}
              onChange={(e) => setAppealExplanation(e.target.value)}
              placeholder="Explain why this enforcement action was a false positive, providing context or verification documents..."
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setAppealModalOpen(null)} sx={{ fontWeight: 800 }}>
            Cancel
          </Button>
          <Button variant="contained" color="primary" onClick={handleAppealSubmit} sx={{ borderRadius: '12px', fontWeight: 900 }}>
            Submit Appeal
          </Button>
        </DialogActions>
      </Dialog>

      {/* Block User Dialog */}
      <Dialog
        open={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ style: { borderRadius: 24, backdropFilter: 'blur(20px)', background: 'rgba(255, 255, 255, 0.95)' } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Block Account / Entity</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <TextField
              label="User ID or Account Handle"
              value={blockUserId}
              onChange={(e) => setBlockUserId(e.target.value)}
              fullWidth
            />
            <TextField
              label="Reason for Block (Optional)"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setBlockModalOpen(false)} sx={{ fontWeight: 800 }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleBlockSubmit} sx={{ borderRadius: '12px', fontWeight: 900 }}>
            Confirm Block
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserSafetyCenter;

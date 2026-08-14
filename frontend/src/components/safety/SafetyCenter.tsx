'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Stack,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  useTheme,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import BlockIcon from '@mui/icons-material/Block';
import GavelIcon from '@mui/icons-material/Gavel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LockIcon from '@mui/icons-material/Lock';
import ShieldIcon from '@mui/icons-material/Shield';
import ReportDialog from './ReportDialog';
import BlockedUsers from './BlockedUsers';
import { safetyApi } from '../../features/trust_safety/api';
import { UserRestriction } from '../../features/trust_safety/types';

export const SafetyCenter: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [openBlockedDialog, setOpenBlockedDialog] = useState(false);
  const [restrictions, setRestrictions] = useState<UserRestriction[]>([]);

  useEffect(() => {
    let mounted = true;
    safetyApi
      .getUserRestrictions()
      .then((res) => {
        if (mounted && res) {
          setRestrictions(res.filter((r) => r.status === 'active'));
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 4 } }}>
      {/* Safety Status Banner */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <SecurityIcon sx={{ color: 'primary.main', fontSize: 40 }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              Kirmya Trust & Safety Center
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Protecting candidates, recruiters, companies, and professional communities through secure moderation & privacy controls.
            </Typography>
          </Box>
        </Stack>

        <Chip
          icon={<ShieldIcon />}
          label={restrictions.length > 0 ? `${restrictions.length} Active Restriction` : 'Account Good Standing'}
          color={restrictions.length > 0 ? 'warning' : 'success'}
          sx={{ fontWeight: 800, py: 2, px: 1, borderRadius: '12px' }}
        />
      </Stack>

      {/* Active Restrictions Alert if present */}
      {restrictions.length > 0 && (
        <Alert severity="warning" icon={<LockIcon />} sx={{ mb: 3, borderRadius: '16px' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            Notice: Account Restriction Active
          </Typography>
          <Typography variant="body2">
            Your account currently has active restrictions. Visit your Account Restrictions settings for details and appeal options.
          </Typography>
        </Alert>
      )}

      {/* Feature Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              p: 3,
              borderRadius: '24px',
              height: '100%',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <VerifiedUserIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Proactive Fraud Prevention
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Automated risk scoring flags fake job postings, payment advance scams, and off-platform recruitment fraud before candidates apply.
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            sx={{
              p: 3,
              borderRadius: '24px',
              height: '100%',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <BlockIcon color="error" sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Server-Side Blocking
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Block abusive users, recruiters, or companies across messaging, search, connections, invitations, and job applications.
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card
            sx={{
              p: 3,
              borderRadius: '24px',
              height: '100%',
              bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <GavelIcon color="info" sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>
              Fair Human Appeal Process
            </Typography>
            <Typography variant="body2" color="text.secondary">
              High-impact decisions require human moderator review. Users can submit evidence for fair appeal review.
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Action Shortcuts */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="error"
          startIcon={<ReportProblemIcon />}
          onClick={() => setOpenReportDialog(true)}
          sx={{ borderRadius: '12px', fontWeight: 800, px: 3, py: 1.2 }}
        >
          Report Abuse or Fraud
        </Button>

        <Button
          variant="outlined"
          color="primary"
          startIcon={<BlockIcon />}
          onClick={() => setOpenBlockedDialog(true)}
          sx={{ borderRadius: '12px', fontWeight: 800, px: 3, py: 1.2 }}
        >
          Manage Blocked Accounts
        </Button>
      </Box>

      {/* Guidelines Accordion */}
      <Typography variant="h5" sx={{ fontWeight: 900, mb: 2 }}>
        Safety & Protection Guidelines
      </Typography>

      <Stack spacing={1.5} sx={{ mb: 4 }}>
        <Accordion sx={{ borderRadius: '16px', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 800 }}>How to Report Fake Jobs or Recruitment Scams</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary">
              Never pay upfront fees, send money via wire transfer, or share sensitive financial details for a job application. Use the &quot;Report Abuse or Fraud&quot; button to report suspicious job listings immediately.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion sx={{ borderRadius: '16px', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 800 }}>How Server-Side User Blocking Works</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary">
              When you block a user or recruiter, they cannot send you messages, view your profile updates, or interact with your job applications. Blocking is enforced server-side across all search and discovery surfaces.
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion sx={{ borderRadius: '16px', '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 800 }}>Reporter Privacy & Anonymity</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary">
              Reporters remain confidential. Your identity, email, and IP address are never exposed to the reported user or company during moderation investigations.
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Stack>

      {/* Reporting Modal */}
      <ReportDialog open={openReportDialog} onClose={() => setOpenReportDialog(false)} />

      {/* Blocked Accounts Dialog Shortcut */}
      <Dialog
        open={openBlockedDialog}
        onClose={() => setOpenBlockedDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ style: { borderRadius: 24 } }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Blocked Accounts Manager</DialogTitle>
        <DialogContent dividers>
          <BlockedUsers />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SafetyCenter;

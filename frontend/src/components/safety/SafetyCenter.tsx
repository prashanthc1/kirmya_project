'use client';

import React, { useState } from 'react';
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
  useTheme,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import BlockIcon from '@mui/icons-material/Block';
import GavelIcon from '@mui/icons-material/Gavel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ReportDialog from './ReportDialog';
import BlockedUsers from './BlockedUsers';

export const SafetyCenter: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [openReportDialog, setOpenReportDialog] = useState(false);

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
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

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, borderRadius: '24px', height: '100%' }}>
            <VerifiedUserIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Proactive Fraud Prevention</Typography>
            <Typography variant="body2" color="text.secondary">
              Automated risk scoring flags fake job postings, payment advance scams, and off-platform recruitment fraud before candidates apply.
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, borderRadius: '24px', height: '100%' }}>
            <BlockIcon color="error" sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Server-Side Blocking</Typography>
            <Typography variant="body2" color="text.secondary">
              Block abusive users, recruiters, or companies across messaging, search, connections, invitations, and job applications.
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, borderRadius: '24px', height: '100%' }}>
            <GavelIcon color="info" sx={{ fontSize: 32, mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>Fair Human Appeal Process</Typography>
            <Typography variant="body2" color="text.secondary">
              High-impact decisions require human moderator review. Users can submit evidence for fair appeal review.
            </Typography>
          </Card>
        </Grid>
      </Grid>

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
      </Box>

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

      <ReportDialog open={openReportDialog} onClose={() => setOpenReportDialog(false)} />
    </Box>
  );
};

export default SafetyCenter;

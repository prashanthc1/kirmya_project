'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  Stack,
  useTheme,
} from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';
import ATSLayout from '../../../components/ats/ATSLayout';
import OfferManager from '../../../components/ats/OfferManager';

export default function RecruiterOffersPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [openModal, setOpenModal] = useState(false);

  const offers = [
    {
      id: 'off-1',
      candidateName: 'Sarah Chen',
      positionTitle: 'Senior Microservices Engineer (Golang)',
      salary: '$95,000 USD',
      joiningDate: 'Sep 01, 2026',
      status: 'Sent',
      expiresAt: 'Aug 15, 2026',
    },
    {
      id: 'off-2',
      candidateName: 'Tariq Al-Mansoor',
      positionTitle: 'Director of Facilities & Real Estate',
      salary: '$110,000 USD',
      joiningDate: 'Sep 15, 2026',
      status: 'Accepted',
      expiresAt: 'Aug 10, 2026',
    },
  ];

  return (
    <ATSLayout>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <LocalOfferIcon sx={{ color: '#10b981', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 900 }}>
            Job Offer &amp; Contract Workflow Management
          </Typography>
        </Stack>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
          sx={{ py: 1, px: 3, borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
        >
          Create New Offer
        </Button>
      </Stack>

      <Grid container spacing={2.5}>
        {offers.map((off) => (
          <Grid item xs={12} md={6} key={off.id}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {off.candidateName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {off.positionTitle}
                  </Typography>
                </Box>
                <Chip
                  label={off.status}
                  size="small"
                  color={off.status === 'Accepted' ? 'success' : off.status === 'Sent' ? 'primary' : 'default'}
                  sx={{ fontWeight: 800 }}
                />
              </Stack>

              <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main', mb: 1 }}>
                {off.salary}
              </Typography>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Target Joining Date: <strong>{off.joiningDate}</strong> • Offer Expires: {off.expiresAt}
              </Typography>

              <Stack direction="row" spacing={1.5}>
                <Button variant="contained" size="small" startIcon={<SendIcon />} sx={{ borderRadius: '8px', fontWeight: 800 }}>
                  Resend Letter
                </Button>
                <Button variant="outlined" size="small" sx={{ borderRadius: '8px', fontWeight: 700 }}>
                  View Package Details
                </Button>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <OfferManager
        open={openModal}
        onClose={() => setOpenModal(false)}
        applicationId="a1111111-1111-1111-1111-111111111111"
        jobId="11111111-1111-1111-1111-111111111111"
        candidateId="c1111111-1111-1111-1111-111111111111"
        candidateName="Sarah Chen"
      />
    </ATSLayout>
  );
}

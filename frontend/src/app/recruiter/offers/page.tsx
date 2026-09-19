'use client';

import React, { useEffect, useState } from 'react';
import {
  Typography,
  Stack,
  Alert,
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ATSLayout from '../../../components/ats/ATSLayout';
import { atsApi } from '../../../features/ats/api';
import type { JobOfferDTO } from '../../../features/ats/types';

export default function RecruiterOffersPage() {
  const [offers, setOffers] = useState<JobOfferDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    atsApi
      .getJobOffers()
      .then((data) => {
        if (mounted) {
          setOffers(data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Offers could not be loaded');
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'Accepted':
        return 'success';
      case 'Sent':
        return 'primary';
      case 'Rejected':
        return 'error';
      case 'Expired':
        return 'default';
      default:
        return 'info';
    }
  };

  return (
    <ATSLayout>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
        <LocalOfferIcon sx={{ color: '#10b981', fontSize: 28 }} />
        <Typography variant="h5" component="h1" sx={{ fontWeight: 900 }}>
          Job Offer &amp; Contract Workflow Management
        </Typography>
      </Stack>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }} data-testid="offers-loading">
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Offers could not be loaded: {error}
        </Alert>
      )}

      {!loading && !error && offers.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            No job offers issued yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Offers are not listed here. To make an offer, open a candidate&apos;s application from your pipeline and use Issue
            Offer there.
          </Typography>
        </Paper>
      )}

      {!loading && !error && offers.length > 0 && (
        <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Candidate</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Position</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Salary</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Contract Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Proposed Joining Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Issued At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {offers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{offer.candidateName}</TableCell>
                  <TableCell>{offer.positionTitle}</TableCell>
                  <TableCell>
                    {offer.salary} {offer.currency && !offer.salary.includes(offer.currency) ? offer.currency : ''}
                  </TableCell>
                  <TableCell>{offer.contractType}</TableCell>
                  <TableCell>{offer.joiningDate || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={offer.status}
                      color={getStatusChipColor(offer.status)}
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell>
                    {offer.createdAt ? new Date(offer.createdAt).toLocaleDateString() : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </ATSLayout>
  );
}

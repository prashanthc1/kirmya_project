'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Grid,
  Button,
  Chip,
  TextField,
  MenuItem,
  Stack,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

export interface OfferItem {
  id: string;
  candidateName: string;
  jobTitle: string;
  salary: string;
  currency: string;
  contractType: string;
  status: 'Draft' | 'Prepared' | 'Sent' | 'Viewed' | 'Accepted' | 'Declined' | 'Expired' | 'Withdrawn';
  joiningDate: string;
  sentDate: string;
}

export const OfferManager: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [offers, setOffers] = useState<OfferItem[]>([
    {
      id: 'off_1',
      candidateName: 'Sarah Chen',
      jobTitle: 'Senior Go Backend Architect',
      salary: '$130,000 / Year',
      currency: 'USD',
      contractType: 'Full-time',
      status: 'Sent',
      joiningDate: '2026-09-15',
      sentDate: '2026-08-10',
    },
    {
      id: 'off_2',
      candidateName: 'Tariq Al-Mansoor',
      jobTitle: 'Director of Facilities & Asset Management',
      salary: '$110,000 / Year',
      currency: 'USD',
      contractType: 'Full-time',
      status: 'Accepted',
      joiningDate: '2026-09-01',
      sentDate: '2026-08-05',
    },
  ]);

  const [openCreate, setOpenCreate] = useState(false);
  const [formData, setFormData] = useState({
    candidateName: 'Elena Rostova',
    jobTitle: 'Senior Go Backend Architect',
    salary: '$125,000',
    currency: 'USD',
    contractType: 'Full-time',
    joiningDate: '2026-10-01',
    benefits: 'Full Medical, Flexible Work, Annual Bonus',
  });

  const getStatusColor = (status: OfferItem['status']) => {
    switch (status) {
      case 'Accepted':
        return 'success';
      case 'Sent':
      case 'Viewed':
        return 'primary';
      case 'Declined':
      case 'Withdrawn':
        return 'error';
      case 'Expired':
        return 'warning';
      default:
        return 'default';
    }
  };

  const handleCreateOffer = () => {
    const item: OfferItem = {
      id: `off_${Date.now()}`,
      candidateName: formData.candidateName,
      jobTitle: formData.jobTitle,
      salary: `${formData.salary} / Year`,
      currency: formData.currency,
      contractType: formData.contractType,
      status: 'Sent',
      joiningDate: formData.joiningDate,
      sentDate: 'Today',
    };
    setOffers([item, ...offers]);
    setOpenCreate(false);
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalOfferIcon color="primary" /> Offer Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track offer generation, candidate response status, and start dates.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreate(true)}
          sx={{
            borderRadius: '12px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          }}
        >
          Generate New Offer
        </Button>
      </Stack>

      <Card
        sx={{
          borderRadius: '20px',
          background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Candidate Name</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Position Title</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Compensation</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Joining Date</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {offers.map((row) => (
              <TableRow key={row.id}>
                <TableCell sx={{ fontWeight: 800 }}>{row.candidateName}</TableCell>
                <TableCell>{row.jobTitle}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{row.salary}</TableCell>
                <TableCell>{row.joiningDate}</TableCell>
                <TableCell>
                  <Chip label={row.status} color={getStatusColor(row.status) as any} size="small" sx={{ fontWeight: 800 }} />
                </TableCell>
                <TableCell align="right">
                  <Button size="small" variant="outlined" sx={{ borderRadius: '8px', fontWeight: 700 }}>
                    View Offer
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Generate Offer Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Prepare &amp; Send Job Offer</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Candidate Name *"
                value={formData.candidateName}
                onChange={(e) => setFormData({ ...formData, candidateName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Position Title *"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Annual Salary *"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Expected Joining Date *"
                InputLabelProps={{ shrink: true }}
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Benefits & Relocation Package"
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateOffer} sx={{ fontWeight: 800 }}>
            Send Formal Offer Letter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OfferManager;

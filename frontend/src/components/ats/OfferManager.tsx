'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  Stack,
  Grid,
  Paper,
  Chip,
  IconButton,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { atsApi } from '../../features/ats/api';

interface OfferManagerProps {
  open: boolean;
  onClose: () => void;
  applicationId: string;
  jobId: string;
  candidateId: string;
  candidateName: string;
  onOfferCreated?: () => void;
}

export const OfferManager: React.FC<OfferManagerProps> = ({
  open,
  onClose,
  applicationId,
  jobId,
  candidateId,
  candidateName,
  onOfferCreated,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [form, setForm] = useState({
    positionTitle: 'Senior Microservices Engineer (Golang)',
    salary: '95,000',
    currency: 'USD',
    benefits: 'Full Health & Dental Insurance, 30 Days Annual Leave, Remote Laptop Stipend',
    joiningDate: '2026-09-01',
    contractType: 'Full-time',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await atsApi.createJobOffer({
        application_id: applicationId,
        job_id: jobId,
        candidate_id: candidateId,
        position_title: form.positionTitle,
        salary: `${form.salary} ${form.currency}`,
        benefits: form.benefits,
        joining_date: form.joiningDate,
        contract_type: form.contractType,
      });
      onOfferCreated?.();
      onClose();
    } catch {
      onOfferCreated?.();
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px', p: 1 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 900 }}>
        Create &amp; Issue Job Offer for {candidateName}
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2.5} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField label="Position Title *" fullWidth value={form.positionTitle} onChange={(e) => setForm({ ...form, positionTitle: e.target.value })} />
            </Grid>

            <Grid item xs={12} sm={8}>
              <TextField label="Annual Base Salary *" fullWidth value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField select label="Currency *" fullWidth value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                {['USD', 'AED', 'EUR', 'GBP'].map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField label="Proposed Joining Date *" type="date" InputLabelProps={{ shrink: true }} fullWidth value={form.joiningDate} onChange={(e) => setForm({ ...form, joiningDate: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Contract Type *" fullWidth value={form.contractType} onChange={(e) => setForm({ ...form, contractType: e.target.value })}>
                {['Full-time', 'Contract', 'Executive Contract'].map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField label="Perks &amp; Benefits Details *" multiline rows={3} fullWidth value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} />
            </Grid>
          </Grid>

          <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 3 }}>
            <Button variant="text" onClick={onClose} sx={{ fontWeight: 700 }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" startIcon={<SendIcon />} sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none', py: 1.2, px: 3 }}>
              Issue Formal Offer Letter
            </Button>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OfferManager;

'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  Stack,
  Paper,
  IconButton,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { motion } from 'framer-motion';
import { springs } from '../../theme/motion';
import GlassCard from '../landing/GlassCard';
import { CertificationItem } from '../../features/onboarding/types';

interface StepProps {
  onNext: (data?: any) => void;
  onPrev: () => void;
}

export const CertificationStep: React.FC<StepProps> = ({ onNext, onPrev }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [certifications, setCertifications] = useState<CertificationItem[]>([
    {
      certificationName: 'AWS Certified Solutions Architect',
      issuingOrganization: 'Amazon Web Services',
      issueDate: '2023-04',
      expiryDate: '2026-04',
      credentialID: 'AWS-8492049',
      credentialURL: 'https://aws.amazon.com/verify',
    },
  ]);

  const handleAdd = () => {
    setCertifications([
      ...certifications,
      {
        certificationName: '',
        issuingOrganization: '',
        issueDate: '',
        expiryDate: '',
        credentialID: '',
        credentialURL: '',
      },
    ]);
  };

  const handleRemove = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof CertificationItem, value: string) => {
    const updated = [...certifications];
    updated[index][field] = value;
    setCertifications(updated);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={springs.entrance}>
      <GlassCard sx={{ p: { xs: 3, md: 5 } }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Certifications & Licenses
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Add industry certifications to increase candidate trust and recruiter verification.
        </Typography>

        <Stack spacing={3} sx={{ mb: 4 }}>
          {certifications.map((cert, idx) => (
            <Paper
              key={idx}
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '16px',
                bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main' }}>
                  Certification #{idx + 1}
                </Typography>
                {certifications.length > 1 && (
                  <IconButton onClick={() => handleRemove(idx)} color="error" size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Certification Name *"
                    fullWidth
                    value={cert.certificationName}
                    onChange={(e) => handleChange(idx, 'certificationName', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Issuing Organization *"
                    fullWidth
                    value={cert.issuingOrganization}
                    onChange={(e) => handleChange(idx, 'issuingOrganization', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Issue Date (YYYY-MM)"
                    fullWidth
                    value={cert.issueDate}
                    onChange={(e) => handleChange(idx, 'issueDate', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Expiry Date (YYYY-MM)"
                    fullWidth
                    value={cert.expiryDate}
                    onChange={(e) => handleChange(idx, 'expiryDate', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Credential ID"
                    fullWidth
                    value={cert.credentialID}
                    onChange={(e) => handleChange(idx, 'credentialID', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Credential URL"
                    fullWidth
                    value={cert.credentialURL}
                    onChange={(e) => handleChange(idx, 'credentialURL', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Stack>

        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{ mb: 4, borderRadius: '12px', fontWeight: 700, textTransform: 'none' }}
        >
          Add Another Certification
        </Button>

        <Stack direction="row" justifyContent="space-between">
          <Button variant="text" onClick={onPrev} startIcon={<ArrowBackIcon />} sx={{ fontWeight: 700 }}>
            Back
          </Button>
          <Button
            variant="contained"
            onClick={() => onNext({ certifications })}
            endIcon={<ArrowForwardIcon />}
            sx={{ py: 1.2, px: 3.5, borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
          >
            Continue
          </Button>
        </Stack>
      </GlassCard>
    </motion.div>
  );
};

export default CertificationStep;

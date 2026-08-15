'use client';

import React, { useState } from 'react';
import {
  Card,
  Typography,
  Chip,
  Button,
  Stack,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import PendingIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';
import ShieldIcon from '@mui/icons-material/Shield';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { profileApi } from '../../features/profile/api';

interface ProfileVerificationCardProps {
  status?: 'verified' | 'pending' | 'unverified' | 'rejected';
  notes?: string;
  onRequestSubmitted?: () => void;
}

export const ProfileVerificationCard: React.FC<ProfileVerificationCardProps> = ({
  status = 'unverified',
  notes,
  onRequestSubmitted,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [docType, setDocType] = useState('government_id');
  const [docUrl, setDocUrl] = useState('');
  const [userNotes, setUserNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const renderBadge = () => {
    switch (status) {
      case 'verified':
        return (
          <Chip
            icon={<VerifiedIcon style={{ color: '#fff' }} />}
            label="Official Verified"
            color="primary"
            sx={{ fontWeight: 800, borderRadius: '10px' }}
          />
        );
      case 'pending':
        return (
          <Chip
            icon={<PendingIcon />}
            label="Verification Pending"
            color="warning"
            sx={{ fontWeight: 800, borderRadius: '10px' }}
          />
        );
      case 'rejected':
        return (
          <Chip
            icon={<CancelIcon />}
            label="Verification Rejected"
            color="error"
            sx={{ fontWeight: 800, borderRadius: '10px' }}
          />
        );
      default:
        return (
          <Chip
            label="Unverified Profile"
            variant="outlined"
            sx={{ fontWeight: 800, borderRadius: '10px' }}
          />
        );
    }
  };

  const handleSubmitVerification = async () => {
    if (!docUrl.trim()) return;
    setSubmitting(true);
    try {
      await profileApi.requestVerification({
        documentType: docType,
        documentUrl: docUrl,
        notes: userNotes,
      });
      setSuccessMsg('Verification request submitted successfully!');
      if (onRequestSubmitted) onRequestSubmitted();
      setTimeout(() => {
        setModalOpen(false);
        setSuccessMsg('');
      }, 1500);
    } catch (err) {
      console.error('Verification request failed', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card
        sx={{
          p: 3,
          borderRadius: '24px',
          mb: 3,
          bgcolor: 'background.paper',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <ShieldIcon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Identity & Credential Verification
            </Typography>
          </Stack>
          {renderBadge()}
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          {status === 'verified'
            ? 'Your candidate identity and credentials have been officially verified by Kirmya moderation team.'
            : status === 'pending'
            ? 'Your verification request is currently under review by our moderation team.'
            : status === 'rejected'
            ? `Your previous request was rejected. ${notes ? `Reason: ${notes}` : ''}`
            : 'Verify your identity and work credentials to gain the Verified badge and boost employer trust.'}
        </Typography>

        {status !== 'verified' && (
          <Button
            variant="contained"
            startIcon={<UploadFileIcon />}
            onClick={() => setModalOpen(true)}
            sx={{ borderRadius: '12px', fontWeight: 800, textTransform: 'none' }}
          >
            {status === 'pending' ? 'Submit Additional Document' : 'Request Profile Verification'}
          </Button>
        )}
      </Card>

      {/* Verification Request Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '24px', p: 1 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900 }}>Request Profile Verification</DialogTitle>
        <DialogContent>
          {successMsg && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }}>
              {successMsg}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload government issued identity document or official employer credential to receive the official Verified badge.
          </Typography>

          <Stack spacing={2.5}>
            <TextField
              select
              fullWidth
              label="Document Type"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            >
              <MenuItem value="government_id">Passport / National ID</MenuItem>
              <MenuItem value="employment_certificate">Official Proof of Employment</MenuItem>
              <MenuItem value="degree_certificate">University Degree Certificate</MenuItem>
              <MenuItem value="license">Professional Board License</MenuItem>
            </TextField>

            <TextField
              fullWidth
              label="Document URL / Cloud File Link"
              placeholder="https://storage.kirmya.com/docs/id-proof.pdf"
              value={docUrl}
              onChange={(e) => setDocUrl(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Additional Audit Notes (Optional)"
              placeholder="Provide any relevant details for the audit team..."
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setModalOpen(false)}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitVerification}
            disabled={submitting || !docUrl.trim()}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 800 }}
          >
            {submitting ? 'Submitting...' : 'Submit Verification Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProfileVerificationCard;

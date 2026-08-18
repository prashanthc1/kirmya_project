'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import FlagIcon from '@mui/icons-material/Flag';
import { DataAccessReviewItem } from '@/features/privacy/types';
import { privacyApi } from '@/features/privacy/services/privacyApi';

const statusColors: Record<DataAccessReviewItem['status'], 'warning' | 'success' | 'error' | 'secondary'> = {
  pending: 'warning',
  approved: 'success',
  revoked: 'error',
  flagged: 'secondary',
};

export const AccessReviewDesk: React.FC = () => {
  const [reviews, setReviews] = useState<DataAccessReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    setLoading(true);
    const data = await privacyApi.getAccessReviews();
    setReviews(data);
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, status: DataAccessReviewItem['status']) => {
    const updated = await privacyApi.updateAccessReviewStatus(id, status);
    setReviews((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  return (
    <Card
      sx={{
        borderRadius: '24px',
        p: 3,
        backdropFilter: 'blur(12px)',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <VerifiedUserIcon sx={{ color: 'info.main', fontSize: 28 }} />
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Privileged Data Access Review Desk
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Audit and approve just-in-time administrative access requests to sensitive production data assets.
          </Typography>
        </Box>
      </Stack>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 800 }}>Target Account</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Resource Requested</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Access Rationale</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Reviewer</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 800 }}>Requested At</TableCell>
              <TableCell sx={{ fontWeight: 800, textAlign: 'right' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reviews.map((rev) => (
              <TableRow key={rev.id} hover>
                <TableCell sx={{ fontWeight: 700 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    {rev.targetUserName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {rev.targetUserId}
                  </Typography>
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', color: 'primary.light' }}>
                  {rev.resourceAccessed}
                </TableCell>
                <TableCell>{rev.accessReason}</TableCell>
                <TableCell>{rev.reviewerName}</TableCell>
                <TableCell>
                  <Chip
                    label={rev.status.toUpperCase()}
                    color={statusColors[rev.status]}
                    size="small"
                    sx={{ fontWeight: 800 }}
                  />
                </TableCell>
                <TableCell>{new Date(rev.createdAt).toLocaleString()}</TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title="Approve Access">
                      <IconButton
                        size="small"
                        color="success"
                        onClick={() => handleUpdateStatus(rev.id, 'approved')}
                      >
                        <CheckCircleIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Revoke Access">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleUpdateStatus(rev.id, 'revoked')}
                      >
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Flag for Security Audit">
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => handleUpdateStatus(rev.id, 'flagged')}
                      >
                        <FlagIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
};

export default AccessReviewDesk;

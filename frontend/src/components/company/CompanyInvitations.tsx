'use client';

/**
 * Outstanding and past invitations for one company.
 *
 * The link itself is never listed here. It is shown once, to whoever created
 * it, because the server stores only a hash — so the honest action for a lost
 * invitation is to revoke it and send a new one, which is exactly what this
 * screen offers.
 */
import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { useInvitations, useRevokeInvitation } from '../../features/company/hooks';
import { hasPermission, roleLabel } from '../../features/company/permissions';
import {
  CompanyInvitation,
  CompanyMembership,
  InvitationStatus,
} from '../../features/company/types';
import GlassPanel from './GlassPanel';

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: 'pending', label: 'Awaiting a reply' },
  { value: '', label: 'All invitations' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
  { value: 'revoked', label: 'Revoked' },
];

const STATUS_COLORS: Record<InvitationStatus, 'warning' | 'success' | 'default' | 'error'> = {
  pending: 'warning',
  accepted: 'success',
  declined: 'default',
  expired: 'default',
  revoked: 'error',
};

/** "in 3 days" / "2 days ago", so an expiry reads without arithmetic. */
const relative = (iso: string): string => {
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return '—';
  const diffDays = Math.round((target - Date.now()) / 86_400_000);
  if (diffDays === 0) return 'today';
  if (diffDays > 0) return `in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
  const past = Math.abs(diffDays);
  return `${past} ${past === 1 ? 'day' : 'days'} ago`;
};

export const CompanyInvitations: React.FC<{ membership: CompanyMembership }> = ({ membership }) => {
  const companyId = membership.company.id;
  const canRevoke =
    hasPermission(membership, 'team:manage') || hasPermission(membership, 'recruiter:manage');

  const [status, setStatus] = React.useState('pending');
  const [revoking, setRevoking] = React.useState<CompanyInvitation | null>(null);
  const [notice, setNotice] = React.useState('');

  const { data, isLoading, isError, error } = useInvitations(companyId, status || undefined, {
    placeholderData: (previous) => previous,
  });
  const revoke = useRevokeInvitation(companyId);

  const invitations = data ?? [];

  return (
    <Stack spacing={3}>
      <GlassPanel>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
        >
          <TextField
            select
            size="small"
            label="Show"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            sx={{ minWidth: 220 }}
          >
            {STATUS_FILTERS.map((option) => (
              <MenuItem key={option.value || 'all'} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <Typography variant="caption" color="text.secondary">
            Each invitation works once and expires on its own.
          </Typography>
        </Stack>
      </GlassPanel>

      {isError && (
        <Alert severity="error" sx={{ borderRadius: '16px' }}>
          {error?.message || 'Invitations could not be loaded.'}
        </Alert>
      )}

      <GlassPanel sx={{ p: 0, overflow: 'hidden' }}>
        {isLoading && !data ? (
          <Box sx={{ p: 3 }}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={52} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : invitations.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
            {status === 'pending'
              ? 'Nobody is waiting on an invitation.'
              : 'No invitations match this filter.'}
          </Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" aria-label="Company invitations">
              <TableHead>
                <TableRow>
                  <TableCell>Invited</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Sent</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invitations.map((invitation) => (
                  <TableRow key={invitation.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {invitation.email}
                      </Typography>
                      {invitation.jobTitle && (
                        <Typography variant="caption" color="text.secondary">
                          {invitation.jobTitle}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" label={roleLabel(invitation.role)} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={STATUS_COLORS[invitation.status] ?? 'default'}
                        label={invitation.status}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={new Date(invitation.createdAt).toLocaleString()}>
                        <Typography variant="caption" color="text.secondary">
                          {relative(invitation.createdAt)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={new Date(invitation.expiresAt).toLocaleString()}>
                        <Typography
                          variant="caption"
                          color={
                            invitation.status === 'pending' &&
                            new Date(invitation.expiresAt).getTime() < Date.now()
                              ? 'error.main'
                              : 'text.secondary'
                          }
                        >
                          {relative(invitation.expiresAt)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      {canRevoke && invitation.status === 'pending' ? (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => setRevoking(invitation)}
                          sx={{ textTransform: 'none' }}
                        >
                          Revoke
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </GlassPanel>

      <Dialog open={!!revoking} onClose={() => setRevoking(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Revoke this invitation?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The link sent to {revoking?.email} stops working immediately. They can be invited again
            with a new one.
          </DialogContentText>
          {revoke.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {(revoke.error as Error).message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevoking(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={revoke.isPending}
            onClick={() =>
              revoking &&
              revoke.mutate(revoking.id, {
                onSuccess: () => {
                  setNotice(`The invitation to ${revoking.email} was revoked.`);
                  setRevoking(null);
                },
              })
            }
          >
            {revoke.isPending ? 'Revoking…' : 'Revoke'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!notice}
        autoHideDuration={5000}
        onClose={() => setNotice('')}
        message={notice}
      />
    </Stack>
  );
};

export default CompanyInvitations;

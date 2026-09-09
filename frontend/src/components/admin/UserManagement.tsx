'use client';

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';

import ImpersonationDialog from './ImpersonationDialog';
import { adminApi } from '../../features/admin/services/adminApi';

export const UserManagement: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  /*
   * The accounts this console governs.
   *
   * These were three literals in component state - "Tariq Al-Mansoor",
   * "John Doe", "Sarah Jenkins" - shown to every administrator on a platform
   * with none of them on it, and the suspend button edited that array. An
   * administrator could suspend a user who does not exist and watch it work.
   *
   * Now the list is the API's, and so is the outcome of every action.
   */
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const {
    data: users = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['admin', 'users', search],
    queryFn: () => adminApi.listUsers(search ? { search } : undefined),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });

  const restrict = useMutation({
    mutationFn: (input: { id: string; isRestricted: boolean; reason: string }) =>
      adminApi.restrictUser(input.id, { isRestricted: input.isRestricted, reason: input.reason }),
    onSuccess: invalidate,
  });

  const verify = useMutation({
    mutationFn: (input: { id: string; notes: string }) =>
      adminApi.verifyUser(input.id, { status: 'verified', notes: input.notes }),
    onSuccess: invalidate,
  });

  const pendingAction = restrict.isPending || verify.isPending;
  const actionError = restrict.error || verify.error;

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionReason, setActionReason] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'unsuspend' | 'verify'>('suspend');

  const [impersonateTarget, setImpersonateTarget] = useState<any | null>(null);

  const handleOpenAction = (user: any, type: 'suspend' | 'unsuspend' | 'verify') => {
    setSelectedUser(user);
    setActionType(type);
    setActionReason('');
    setDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedUser) return;
    try {
      if (actionType === 'verify') {
        await verify.mutateAsync({ id: selectedUser.id, notes: actionReason });
      } else {
        await restrict.mutateAsync({
          id: selectedUser.id,
          isRestricted: actionType === 'suspend',
          reason: actionReason,
        });
      }
      setDialogOpen(false);
    } catch {
      // Kept open, with the error shown, because the account was not changed.
      // Closing on a failure is what let the console report work it never did.
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
        User Account Governance
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Audit user profiles, enforce suspensions/restrictions, review security logs, and verify identities.
      </Typography>

      <Card
        sx={{
          borderRadius: '24px',
          p: 3,
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <TextField
            placeholder="Search users by name, email, or ID..."
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            inputProps={{ 'aria-label': 'Search users' }}
            InputProps={{ startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} /> }}
          />
        </Stack>

        <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Full Name &amp; Email</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Verification</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Registered Date</TableCell>
                <TableCell sx={{ fontWeight: 800 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/*
                Three honest states in place of a list that was always full.
                An administrator has to be able to tell "no accounts match" from
                "the directory could not be read"; a fabricated row answers both
                questions wrongly.
              */}
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 3 }} role="status" aria-live="polite">
                      <CircularProgress size={20} />
                      <Typography variant="body2" color="text.secondary">Loading accounts…</Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              )}
              {isError && !isLoading && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Alert severity="error" sx={{ my: 2 }}>
                      The user directory could not be loaded.
                      {error instanceof Error ? ` ${error.message}` : ''}
                    </Alert>
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && !isError && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                      {search ? 'No accounts match that search.' : 'No accounts yet.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {users.map((u: any) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{u.fullName}</Typography>
                    <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={u.role} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.status}
                      size="small"
                      color={u.status === 'Active' ? 'success' : 'error'}
                      sx={{ fontWeight: 800 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={u.verificationStatus}
                      size="small"
                      color={u.verificationStatus === 'Verified' ? 'info' : 'default'}
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{u.createdAt}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        color="secondary"
                        startIcon={<SupervisorAccountIcon />}
                        onClick={() => setImpersonateTarget(u)}
                        sx={{ fontWeight: 800 }}
                      >
                        Impersonate
                      </Button>
                      {u.status === 'Active' ? (
                        <Button
                          size="small"
                          color="error"
                          startIcon={<LockIcon />}
                          onClick={() => handleOpenAction(u, 'suspend')}
                          sx={{ fontWeight: 800 }}
                        >
                          Suspend
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          color="success"
                          startIcon={<LockOpenIcon />}
                          onClick={() => handleOpenAction(u, 'unsuspend')}
                          sx={{ fontWeight: 800 }}
                        >
                          Unsuspend
                        </Button>
                      )}
                      {u.verificationStatus !== 'Verified' && (
                        <Button
                          size="small"
                          color="info"
                          startIcon={<VerifiedUserIcon />}
                          onClick={() => handleOpenAction(u, 'verify')}
                          sx={{ fontWeight: 800 }}
                        >
                          Verify
                        </Button>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>
          {actionType === 'suspend' ? 'Suspend User Account' : actionType === 'unsuspend' ? 'Reactivate User Account' : 'Manually Verify User'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Action target: <strong>{selectedUser?.fullName} ({selectedUser?.email})</strong>
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Mandatory Reason for Audit Log *"
            value={actionReason}
            onChange={(e) => setActionReason(e.target.value)}
            placeholder="Specify policy violation details or identity verification document ID..."
          />
          {/* The API refused. The dialog stays open and says so, because the
              account was not changed and the administrator needs to know. */}
          {actionError ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              The account was not changed.
              {actionError instanceof Error ? ` ${actionError.message}` : ''}
            </Alert>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={actionType === 'suspend' ? 'error' : 'primary'}
            disabled={!actionReason || pendingAction}
            onClick={handleConfirmAction}
            sx={{ fontWeight: 800 }}
          >
            {pendingAction ? 'Working…' : 'Confirm Action'}
          </Button>
        </DialogActions>
      </Dialog>

      {impersonateTarget && (
        <ImpersonationDialog
          open={Boolean(impersonateTarget)}
          onClose={() => setImpersonateTarget(null)}
          targetUser={{ id: impersonateTarget.id, name: impersonateTarget.fullName, email: impersonateTarget.email }}
        />
      )}
    </Box>
  );
};

export default UserManagement;

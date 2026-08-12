'use client';

import React, { useState } from 'react';
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

export const UserManagement: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [users, setUsers] = useState([
    { id: 'u1', email: 'tariq@kirmya.com', fullName: 'Tariq Al-Mansoor', status: 'Active', verificationStatus: 'Verified', role: 'JobSeeker', createdAt: '2026-01-15' },
    { id: 'u2', email: 'john.doe@spammatch.com', fullName: 'John Doe', status: 'Suspended', verificationStatus: 'Unverified', role: 'JobSeeker', createdAt: '2026-08-01' },
    { id: 'u3', email: 'sarah.recruiter@techcorp.com', fullName: 'Sarah Jenkins', status: 'Active', verificationStatus: 'Verified', role: 'Recruiter', createdAt: '2026-03-10' },
  ]);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionReason, setActionReason] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'unsuspend' | 'verify'>('suspend');

  const handleOpenAction = (user: any, type: 'suspend' | 'unsuspend' | 'verify') => {
    setSelectedUser(user);
    setActionType(type);
    setActionReason('');
    setDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (!selectedUser) return;
    if (actionType === 'suspend') {
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? { ...u, status: 'Suspended' } : u)));
    } else if (actionType === 'unsuspend') {
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? { ...u, status: 'Active' } : u)));
    } else if (actionType === 'verify') {
      setUsers((prev) => prev.map((u) => (u.id === selectedUser.id ? { ...u, verificationStatus: 'Verified' } : u)));
    }
    setDialogOpen(false);
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
              {users.map((u) => (
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
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={actionType === 'suspend' ? 'error' : 'primary'}
            disabled={!actionReason}
            onClick={handleConfirmAction}
            sx={{ fontWeight: 800 }}
          >
            Confirm Action
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;

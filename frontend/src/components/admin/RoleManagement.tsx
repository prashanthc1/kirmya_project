'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

import {
  assignAdminRole,
  findAdminUserByEmail,
  listAdminRoles,
  revokeAdminRole,
  type AdminRole,
} from '../../services/adminRoleService';
import { extractApiError } from '../../services/api';

/**
 * Administrative roles.
 *
 * This screen used to be entirely invented: five roles that exist nowhere in
 * the platform, assignment counts of 2, 5, 12, 18 and 4 that were literals in
 * the source, and a Confirm button that set a success message without making a
 * request. An administrator could assign a role, be told it worked, and have
 * changed nothing - which is the trap this whole slice exists to close.
 *
 * What the roles mean is worth stating on the page, because it is the opposite
 * of what "assign a role" usually implies: an account with no assignment holds
 * every administrative permission, so assigning one *restricts* that
 * administrator. It never grants administrative access - users.role_id decides
 * that, and this screen cannot change it.
 */
export const RoleManagement: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [dialog, setDialog] = useState<'assign' | 'revoke' | null>(null);
  const [targetEmail, setTargetEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const served = await listAdminRoles();
      setRoles(served);
      setSelectedRole(current => current || served[0]?.code || '');
    } catch (error) {
      // Say the roles could not be loaded rather than showing an empty table,
      // which reads as "this platform defines no roles".
      setLoadError(extractApiError(error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const closeDialog = () => {
    setDialog(null);
    setFormError(null);
    setTargetEmail('');
    setReason('');
  };

  const submit = async () => {
    const action = dialog;
    if (!action) return;

    setFormError(null);
    if (!targetEmail.trim()) {
      setFormError('An email address is required.');
      return;
    }
    if (!reason.trim()) {
      setFormError('A reason is required. It is recorded in the audit log.');
      return;
    }

    setSubmitting(true);
    try {
      const user = await findAdminUserByEmail(targetEmail);
      if (!user) {
        setFormError(`No account found for ${targetEmail.trim()}.`);
        return;
      }

      const input = { userId: user.id, roleCode: selectedRole, reason: reason.trim() };
      if (action === 'assign') {
        await assignAdminRole(input);
        setSuccess(
          `${user.email} now holds only the permissions of ${selectedRole}. Their administrative access is narrowed until this is revoked.`
        );
      } else {
        await revokeAdminRole(input);
        setSuccess(`${selectedRole} removed from ${user.email}.`);
      }
      closeDialog();
    } catch (error) {
      // The server's own reason, which distinguishes an unknown role, an
      // attempt to change one's own roles, and a missing permission.
      setFormError(extractApiError(error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 900, mb: 1 }}>
            Administrative roles
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            An administrator with no role assigned holds every administrative permission.
            Assigning a role restricts them to that role&apos;s permissions; it does not grant
            administrative access.
          </Typography>
          {/*
            Stated because the alternative is a control that overstates itself.
            Narrowing is enforced on /api/v1/admin/* - the routes this console
            drives. Eighteen other modules carry their own administrative route
            groups behind the same coarse role check and are not yet narrowed by
            these roles, so a restricted administrator still reaches those.
          */}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Restrictions apply to the administration console. Some
            module-specific administrative endpoints are not yet covered.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={() => setDialog('revoke')}
            disabled={roles.length === 0}
            sx={{ borderRadius: '12px', fontWeight: 800 }}
          >
            Revoke
          </Button>
          <Button
            variant="contained"
            startIcon={<AdminPanelSettingsIcon />}
            onClick={() => setDialog('assign')}
            disabled={roles.length === 0}
            sx={{ borderRadius: '12px', fontWeight: 800, px: 3 }}
          >
            Assign role
          </Button>
        </Stack>
      </Stack>

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {loadError && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: '12px' }}
          action={
            <Button color="inherit" size="small" onClick={() => void load()}>
              Retry
            </Button>
          }
        >
          {loadError}
        </Alert>
      )}

      <Card
        sx={{
          borderRadius: '24px',
          p: 3,
          bgcolor: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {loading ? (
          <Stack alignItems="center" sx={{ py: 6 }}>
            <CircularProgress />
          </Stack>
        ) : roles.length === 0 && !loadError ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            This platform defines no administrative roles.
          </Typography>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>What it allows</TableCell>
                  <TableCell sx={{ fontWeight: 800 }}>Type</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map(role => (
                  <TableRow key={role.code}>
                    <TableCell>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                        {role.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontFamily: 'monospace' }}
                      >
                        {role.code}
                      </Typography>
                    </TableCell>
                    <TableCell>{role.description}</TableCell>
                    <TableCell>
                      <Chip
                        label={role.isSystem ? 'Platform role' : 'Custom role'}
                        color={role.isSystem ? 'primary' : 'default'}
                        size="small"
                        sx={{ fontWeight: 800 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={dialog !== null} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 900 }}>
          {dialog === 'revoke' ? 'Revoke an administrative role' : 'Assign an administrative role'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            {dialog === 'assign' && (
              <Alert severity="info" sx={{ borderRadius: '10px' }}>
                This restricts the account to the chosen role&apos;s permissions. You cannot change
                your own roles.
              </Alert>
            )}
            <TextField
              label="User email address"
              value={targetEmail}
              onChange={event => setTargetEmail(event.target.value)}
              fullWidth
              required
              autoComplete="off"
            />
            <TextField
              select
              label={dialog === 'revoke' ? 'Role to revoke' : 'Role to assign'}
              value={selectedRole}
              onChange={event => setSelectedRole(event.target.value)}
              fullWidth
            >
              {roles.map(role => (
                <MenuItem key={role.code} value={role.code}>
                  {role.name} ({role.code})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Reason"
              value={reason}
              onChange={event => setReason(event.target.value)}
              fullWidth
              required
              multiline
              minRows={2}
              helperText="Recorded in the administrative audit log."
            />
            {formError && (
              <Alert severity="error" sx={{ borderRadius: '10px' }}>
                {formError}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={closeDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void submit()}
            disabled={submitting || !selectedRole}
            sx={{ borderRadius: '10px', fontWeight: 800 }}
          >
            {submitting ? 'Working…' : dialog === 'revoke' ? 'Revoke' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleManagement;

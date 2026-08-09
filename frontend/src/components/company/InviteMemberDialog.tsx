'use client';

/**
 * Invite someone to a company's team or recruiting group.
 *
 * The role list is narrowed by `assignableRoles`, which mirrors the server's
 * rule that nobody hands out a role at or above their own. The server enforces
 * it again; offering a role it will refuse would just produce a broken screen.
 *
 * The invitation link is shown once, on success, because that is the only
 * moment the plaintext token exists — the server stores a hash. It is not
 * emailed a second time from here and it cannot be recovered later.
 */
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import { InviteForm, inviteSchema } from '../../features/company/schemas';
import { assignableRoles, roleLabel } from '../../features/company/permissions';
import {
  ASSOCIATION_LABELS,
  AssociationType,
  CompanyDepartment,
  CompanyMembership,
  CompanyRole,
  InvitationIssued,
} from '../../features/company/types';

interface InviteMemberDialogProps {
  open: boolean;
  onClose: () => void;
  membership: CompanyMembership;
  departments?: CompanyDepartment[];
  /** Narrows the offered roles further, e.g. to the recruiting roles. */
  limitRoles?: CompanyRole[];
  title: string;
  description: string;
  isPending: boolean;
  error?: Error | null;
  onSubmit: (payload: InviteForm) => Promise<InvitationIssued>;
}

const ASSOCIATION_OPTIONS = Object.keys(ASSOCIATION_LABELS) as AssociationType[];

export const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({
  open,
  onClose,
  membership,
  departments = [],
  limitRoles,
  title,
  description,
  isPending,
  error,
  onSubmit,
}) => {
  const [issued, setIssued] = React.useState<InvitationIssued | null>(null);
  const [copied, setCopied] = React.useState(false);

  const roles = React.useMemo(() => {
    const allowed = assignableRoles(membership);
    return limitRoles ? allowed.filter((role) => limitRoles.includes(role)) : allowed;
  }, [membership, limitRoles]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: roles[0] ?? '',
      associationType: '',
      jobTitle: '',
      departmentId: '',
      message: '',
      channel: 'email',
    },
  });

  const close = () => {
    setIssued(null);
    setCopied(false);
    reset();
    onClose();
  };

  const submit = handleSubmit(async (values) => {
    const result = await onSubmit(values);
    setIssued(result);
  });

  const copyLink = async () => {
    if (!issued?.acceptUrl || typeof navigator === 'undefined' || !navigator.clipboard) return;
    await navigator.clipboard.writeText(issued.acceptUrl);
    setCopied(true);
  };

  if (roles.length === 0) {
    return (
      <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Alert severity="info">
            Your role does not allow you to hand out any role at this company. Only a more senior
            administrator can invite here.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={close} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>

      {issued ? (
        <>
          <DialogContent>
            <Alert severity="success" sx={{ mb: 2 }}>
              <AlertTitle>Invitation sent to {issued.invitation.email}</AlertTitle>
              It expires on {new Date(issued.invitation.expiresAt).toLocaleString()} and can be
              used once.
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              This link is shown only now. The server keeps a hash of it, so it cannot be displayed
              again — revoke and re-invite if it is lost.
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={issued.acceptUrl}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title={copied ? 'Copied' : 'Copy link'}>
                      <IconButton onClick={copyLink} edge="end" aria-label="Copy invitation link">
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={close} variant="contained">
              Done
            </Button>
          </DialogActions>
        </>
      ) : (
        <Box component="form" onSubmit={submit} noValidate>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {description}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error.message}
              </Alert>
            )}

            <Stack spacing={2}>
              <TextField
                {...register('email')}
                label="Email address"
                type="email"
                fullWidth
                required
                autoFocus
                error={!!errors.email}
                helperText={errors.email?.message}
              />

              <TextField
                {...register('role')}
                select
                label="Role"
                fullWidth
                required
                defaultValue={roles[0]}
                error={!!errors.role}
                helperText={
                  errors.role?.message ??
                  'Only roles below your own are listed, and the server checks again.'
                }
              >
                {roles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {roleLabel(role)}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                {...register('associationType')}
                select
                label="How they are associated"
                fullWidth
                defaultValue=""
                helperText="Shown on the people page once they accept and make it public."
              >
                <MenuItem value="">Not specified</MenuItem>
                {ASSOCIATION_OPTIONS.map((type) => (
                  <MenuItem key={type} value={type}>
                    {ASSOCIATION_LABELS[type]}
                  </MenuItem>
                ))}
              </TextField>

              <TextField {...register('jobTitle')} label="Job title" fullWidth />

              {departments.length > 0 && (
                <TextField {...register('departmentId')} select label="Department" fullWidth defaultValue="">
                  <MenuItem value="">No department</MenuItem>
                  {departments.map((department) => (
                    <MenuItem key={department.id} value={department.id}>
                      {department.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <TextField
                {...register('message')}
                label="Message"
                fullWidth
                multiline
                minRows={2}
                placeholder="Optional note included with the invitation"
              />
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button onClick={close} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isPending}>
              {isPending ? 'Sending…' : 'Send invitation'}
            </Button>
          </DialogActions>
        </Box>
      )}
    </Dialog>
  );
};

export default InviteMemberDialog;

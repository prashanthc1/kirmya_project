'use client';

/**
 * Team management for one company.
 *
 * Reading this list needs `team:view`, which is also what makes member email
 * addresses visible; without it the server omits them and this screen is not
 * reachable. Every control below is gated on the permission the matching
 * endpoint requires, and the endpoint checks it again.
 *
 * Approving an association is a deliberate act: a person asking to be listed as
 * an employee stays invisible on the public page until someone here approves,
 * and the person themselves still controls whether it is shown publicly.
 */
import React from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Pagination,
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
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PublicIcon from '@mui/icons-material/Public';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

import {
  useDecideAssociation,
  useDepartments,
  useInviteTeamMember,
  useRemoveTeamMember,
  useTeam,
  useUpdateTeamMember,
} from '../../features/company/hooks';
import { assignableRoles, hasPermission, roleLabel } from '../../features/company/permissions';
import {
  ASSOCIATION_LABELS,
  CompanyMembership,
  CompanyPermission,
  CompanyPerson,
  CompanyRole,
  MembershipStatus,
} from '../../features/company/types';
import GlassPanel from './GlassPanel';
import InviteMemberDialog from './InviteMemberDialog';
import CompanyPermissions from './CompanyPermissions';

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All members' },
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Awaiting approval' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'removed', label: 'Removed' },
];

const STATUS_COLORS: Record<MembershipStatus, 'success' | 'warning' | 'default' | 'error'> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'error',
  removed: 'default',
  suspended: 'error',
};

const rolesOf = (person: CompanyPerson): CompanyRole[] =>
  person.roles && person.roles.length > 0 ? person.roles : [person.role];

interface CompanyTeamProps {
  membership: CompanyMembership;
  /** Preselects the status filter, used by the "pending approvals" shortcut. */
  initialStatus?: string;
}

export const CompanyTeam: React.FC<CompanyTeamProps> = ({ membership, initialStatus = '' }) => {
  const companyId = membership.company.id;
  const can = (permission: CompanyPermission) => hasPermission(membership, permission);

  const [status, setStatus] = React.useState(initialStatus);
  const [search, setSearch] = React.useState('');
  const [applied, setApplied] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [menuFor, setMenuFor] = React.useState<{ el: HTMLElement; person: CompanyPerson } | null>(
    null
  );
  const [editing, setEditing] = React.useState<CompanyPerson | null>(null);
  const [permissionsFor, setPermissionsFor] = React.useState<CompanyPerson | null>(null);
  const [removing, setRemoving] = React.useState<CompanyPerson | null>(null);
  const [notice, setNotice] = React.useState('');

  const query = React.useMemo(
    () => ({
      page,
      limit: 20,
      ...(status ? { status } : {}),
      ...(applied ? { query: applied } : {}),
    }),
    [page, status, applied]
  );

  const { data, isLoading, isError, error, isFetching } = useTeam(companyId, query, {
    placeholderData: (previous) => previous,
  });
  const { data: departments } = useDepartments(companyId, { enabled: can('team:invite') });

  const invite = useInviteTeamMember(companyId);
  const updateMember = useUpdateTeamMember(companyId);
  const removeMember = useRemoveTeamMember(companyId);
  const decide = useDecideAssociation(companyId);

  const roleOptions = React.useMemo(() => assignableRoles(membership), [membership]);

  const closeMenu = () => setMenuFor(null);

  const handleDecision = (person: CompanyPerson, decision: 'approve' | 'reject') => {
    decide.mutate(
      { memberId: person.id, decision },
      {
        onSuccess: () =>
          setNotice(
            decision === 'approve'
              ? `${person.name} was approved as a member.`
              : `${person.name}'s request was rejected.`
          ),
      }
    );
  };

  const people = data?.items ?? [];

  return (
    <Stack spacing={3}>
      <GlassPanel>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ md: 'center' }}
          justifyContent="space-between"
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              setApplied(search);
              setPage(1);
            }}
            sx={{ flexGrow: 1 }}
          >
            <TextField
              size="small"
              label="Search name or title"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              sx={{ minWidth: 220 }}
            />
            <TextField
              size="small"
              select
              label="Status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 180 }}
            >
              {STATUS_FILTERS.map((option) => (
                <MenuItem key={option.value || 'all'} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <Button type="submit" variant="outlined" sx={{ textTransform: 'none' }}>
              Search
            </Button>
          </Stack>

          {can('team:invite') && (
            <Button
              variant="contained"
              startIcon={<PersonAddAlt1Icon />}
              onClick={() => setInviteOpen(true)}
              sx={{ textTransform: 'none', flexShrink: 0 }}
            >
              Invite member
            </Button>
          )}
        </Stack>
      </GlassPanel>

      {isError && (
        <Alert severity="error" sx={{ borderRadius: '16px' }}>
          {error?.message || 'The team could not be loaded.'}
        </Alert>
      )}

      <GlassPanel sx={{ p: 0, overflow: 'hidden' }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ px: { xs: 2, md: 3 }, pt: 2.5, pb: 1.5 }}
        >
          <Typography variant="body2" color="text.secondary">
            {data?.total ?? 0} {(data?.total ?? 0) === 1 ? 'member' : 'members'}
          </Typography>
          {isFetching && <CircularProgress size={14} />}
        </Stack>

        {isLoading && !data ? (
          <Box sx={{ p: 3 }}>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={56} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : people.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
            No members match these filters.
          </Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" aria-label="Company team">
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell>
                  <TableCell>Association</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Visibility</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {people.map((person) => (
                  <TableRow key={person.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar src={person.photoUrl || undefined} sx={{ width: 34, height: 34 }}>
                          {person.name?.charAt(0)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                            {person.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {[person.jobTitle, person.email].filter(Boolean).join(' · ') || '—'}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption">
                        {ASSOCIATION_LABELS[person.associationType] ?? person.associationType}
                      </Typography>
                      {person.department && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {person.department}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {rolesOf(person).map((role) => (
                          <Chip key={role} size="small" variant="outlined" label={roleLabel(role)} />
                        ))}
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        color={STATUS_COLORS[person.status] ?? 'default'}
                        label={person.status}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>

                    <TableCell>
                      <Tooltip
                        title={
                          person.isPublic
                            ? 'This person chose to show the association publicly'
                            : 'This person keeps the association private'
                        }
                      >
                        {person.isPublic ? (
                          <PublicIcon fontSize="small" color="action" />
                        ) : (
                          <LockOutlinedIcon fontSize="small" color="action" />
                        )}
                      </Tooltip>
                    </TableCell>

                    <TableCell align="right">
                      {person.status === 'pending' && can('people:approve') ? (
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title="Approve">
                            <span>
                              <IconButton
                                size="small"
                                color="success"
                                disabled={decide.isPending}
                                onClick={() => handleDecision(person, 'approve')}
                                aria-label={`Approve ${person.name}`}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <span>
                              <IconButton
                                size="small"
                                color="error"
                                disabled={decide.isPending}
                                onClick={() => handleDecision(person, 'reject')}
                                aria-label={`Reject ${person.name}`}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Stack>
                      ) : can('team:manage') || can('permission:edit') ? (
                        <IconButton
                          size="small"
                          onClick={(event) =>
                            setMenuFor({ el: event.currentTarget, person })
                          }
                          aria-label={`Actions for ${person.name}`}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}

        {(data?.totalPages ?? 0) > 1 && (
          <Stack alignItems="center" sx={{ py: 2 }}>
            <Pagination
              count={data?.totalPages ?? 1}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              shape="rounded"
            />
          </Stack>
        )}
      </GlassPanel>

      <Menu anchorEl={menuFor?.el ?? null} open={!!menuFor} onClose={closeMenu}>
        {can('team:manage') && roleOptions.length > 0 && (
          <MenuItem
            onClick={() => {
              setEditing(menuFor!.person);
              closeMenu();
            }}
          >
            Change role or department
          </MenuItem>
        )}
        {can('permission:edit') && (
          <MenuItem
            onClick={() => {
              setPermissionsFor(menuFor!.person);
              closeMenu();
            }}
          >
            Adjust permissions
          </MenuItem>
        )}
        {can('team:manage') && (
          <MenuItem
            sx={{ color: 'error.main' }}
            onClick={() => {
              setRemoving(menuFor!.person);
              closeMenu();
            }}
          >
            Remove from company
          </MenuItem>
        )}
      </Menu>

      {editing && (
        <EditMemberDialog
          person={editing}
          roleOptions={roleOptions}
          departments={departments ?? []}
          isPending={updateMember.isPending}
          error={updateMember.error as Error | null}
          onClose={() => setEditing(null)}
          onSave={(payload) =>
            updateMember.mutate(
              { memberId: editing.id, payload },
              {
                onSuccess: () => {
                  setNotice(`${editing.name} was updated.`);
                  setEditing(null);
                },
              }
            )
          }
        />
      )}

      {permissionsFor && (
        <CompanyPermissions
          companyId={companyId}
          person={permissionsFor}
          actorPermissions={membership.permissions}
          onClose={() => setPermissionsFor(null)}
          onSaved={(name) => setNotice(`Permissions for ${name} were updated.`)}
        />
      )}

      <Dialog open={!!removing} onClose={() => setRemoving(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove {removing?.name}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            They lose every permission at {membership.company.name} immediately. Their profile,
            applications and messages are untouched — this only ends the company association.
          </DialogContentText>
          {removeMember.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {(removeMember.error as Error).message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoving(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={removeMember.isPending}
            onClick={() =>
              removing &&
              removeMember.mutate(removing.id, {
                onSuccess: () => {
                  setNotice(`${removing.name} was removed.`);
                  setRemoving(null);
                },
              })
            }
          >
            {removeMember.isPending ? 'Removing…' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      <InviteMemberDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        membership={membership}
        departments={departments ?? []}
        title={`Invite someone to ${membership.company.name}`}
        description="They receive a single-use link that expires. Nothing changes at this company until they accept it."
        isPending={invite.isPending}
        error={invite.error as Error | null}
        onSubmit={(values) =>
          invite.mutateAsync({
            email: values.email,
            role: values.role,
            associationType: values.associationType || undefined,
            jobTitle: values.jobTitle || undefined,
            departmentId: values.departmentId || null,
            message: values.message || undefined,
            channel: values.channel || undefined,
          })
        }
      />

      <Snackbar
        open={!!notice}
        autoHideDuration={5000}
        onClose={() => setNotice('')}
        message={notice}
      />
    </Stack>
  );
};

interface EditMemberDialogProps {
  person: CompanyPerson;
  roleOptions: CompanyRole[];
  departments: Array<{ id: string; name: string }>;
  isPending: boolean;
  error: Error | null;
  onClose: () => void;
  onSave: (payload: {
    role?: string;
    status?: string;
    jobTitle?: string;
    departmentId?: string | null;
  }) => void;
}

const EditMemberDialog: React.FC<EditMemberDialogProps> = ({
  person,
  roleOptions,
  departments,
  isPending,
  error,
  onClose,
  onSave,
}) => {
  const [role, setRole] = React.useState<string>(person.role);
  const [status, setStatus] = React.useState<string>(person.status);
  const [jobTitle, setJobTitle] = React.useState(person.jobTitle ?? '');
  const [departmentId, setDepartmentId] = React.useState(person.departmentId ?? '');

  // The current role stays selectable even when it is above what this actor can
  // assign, so opening the dialog cannot silently demote anyone.
  const options = roleOptions.includes(person.role) ? roleOptions : [person.role, ...roleOptions];

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Edit {person.name}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message}
          </Alert>
        )}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            select
            label="Role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            fullWidth
            helperText="Roles at or above your own are not offered."
          >
            {options.map((option) => (
              <MenuItem key={option} value={option} disabled={!roleOptions.includes(option)}>
                {roleLabel(option)}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            fullWidth
          >
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="suspended">Suspended</MenuItem>
          </TextField>

          <TextField
            label="Job title"
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
            fullWidth
          />

          {departments.length > 0 && (
            <TextField
              select
              label="Department"
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              fullWidth
            >
              <MenuItem value="">No department</MenuItem>
              {departments.map((department) => (
                <MenuItem key={department.id} value={department.id}>
                  {department.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={isPending}
          onClick={() =>
            onSave({
              role,
              status,
              jobTitle,
              departmentId: departmentId || null,
            })
          }
        >
          {isPending ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompanyTeam;

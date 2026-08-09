'use client';

/**
 * The recruiting team for one company.
 *
 * These are the same membership rows the team page manages, filtered to the
 * recruiting roles — there is no second recruiter record. What lives here is
 * only the company's side of the relationship: a recruiter's own profile, their
 * jobs and their candidate pipelines belong to the recruiter module and are
 * linked to, not duplicated.
 */
import React from 'react';
import NextLink from 'next/link';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Menu,
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
  Typography,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';

import {
  useInviteRecruiter,
  useRecruiters,
  useRemoveRecruiter,
  useSetRecruiterSuspended,
} from '../../features/company/hooks';
import { hasPermission, roleLabel } from '../../features/company/permissions';
import {
  CompanyMembership,
  CompanyPermission,
  CompanyPerson,
  CompanyRole,
} from '../../features/company/types';
import GlassPanel from './GlassPanel';
import InviteMemberDialog from './InviteMemberDialog';
import CompanyPermissions from './CompanyPermissions';

/** The roles this screen manages. Anything else belongs to the team page. */
const RECRUITING_ROLES: CompanyRole[] = ['recruiter_admin', 'recruiter', 'hiring_manager'];

const ROLE_FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All recruiting roles' },
  ...RECRUITING_ROLES.map((role) => ({ value: role, label: roleLabel(role) })),
];

export const CompanyRecruiters: React.FC<{ membership: CompanyMembership }> = ({ membership }) => {
  const companyId = membership.company.id;
  const can = (permission: CompanyPermission) => hasPermission(membership, permission);

  const [role, setRole] = React.useState('');
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [menuFor, setMenuFor] = React.useState<{ el: HTMLElement; person: CompanyPerson } | null>(
    null
  );
  const [permissionsFor, setPermissionsFor] = React.useState<CompanyPerson | null>(null);
  const [removing, setRemoving] = React.useState<CompanyPerson | null>(null);
  const [notice, setNotice] = React.useState('');

  const query = React.useMemo(() => (role ? { role } : {}), [role]);
  const { data, isLoading, isError, error } = useRecruiters(companyId, query, {
    placeholderData: (previous) => previous,
  });

  const invite = useInviteRecruiter(companyId);
  const setSuspended = useSetRecruiterSuspended(companyId);
  const remove = useRemoveRecruiter(companyId);

  const recruiters = data?.items ?? [];
  const closeMenu = () => setMenuFor(null);

  const toggleSuspension = (person: CompanyPerson) => {
    const suspended = person.status !== 'suspended';
    setSuspended.mutate(
      { recruiterId: person.id, suspended },
      {
        onSuccess: () =>
          setNotice(
            suspended
              ? `${person.name} can no longer act for this company.`
              : `${person.name} was reinstated.`
          ),
      }
    );
  };

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
            label="Role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            sx={{ minWidth: 220 }}
          >
            {ROLE_FILTERS.map((option) => (
              <MenuItem key={option.value || 'all'} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          {can('recruiter:invite') && (
            <Button
              variant="contained"
              startIcon={<PersonAddAlt1Icon />}
              onClick={() => setInviteOpen(true)}
              sx={{ textTransform: 'none' }}
            >
              Invite recruiter
            </Button>
          )}
        </Stack>
      </GlassPanel>

      {isError && (
        <Alert severity="error" sx={{ borderRadius: '16px' }}>
          {error?.message || 'The recruiting team could not be loaded.'}
        </Alert>
      )}

      <GlassPanel sx={{ p: 0, overflow: 'hidden' }}>
        {isLoading && !data ? (
          <Box sx={{ p: 3 }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={56} sx={{ mb: 1 }} />
            ))}
          </Box>
        ) : recruiters.length === 0 ? (
          <Stack spacing={1} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No one holds a recruiting role at this company yet.
            </Typography>
            {can('recruiter:invite') && (
              <Typography variant="caption" color="text.secondary">
                Invite a recruiter to let them post jobs and work candidates on your behalf.
              </Typography>
            )}
          </Stack>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" aria-label="Recruiting team">
              <TableHead>
                <TableRow>
                  <TableCell>Recruiter</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recruiters.map((person) => (
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
                      <Chip size="small" variant="outlined" label={roleLabel(person.role)} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={person.status === 'approved' ? 'success' : 'warning'}
                        label={person.status}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(person.joinedAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {can('recruiter:manage') || can('permission:edit') ? (
                        <IconButton
                          size="small"
                          onClick={(event) => setMenuFor({ el: event.currentTarget, person })}
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
      </GlassPanel>

      {can('analytics:view') && (
        <Button
          component={NextLink}
          href="/company/dashboard/analytics"
          variant="outlined"
          size="small"
          sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
        >
          See what each recruiter has done
        </Button>
      )}

      <Menu anchorEl={menuFor?.el ?? null} open={!!menuFor} onClose={closeMenu}>
        {can('recruiter:manage') && (
          <MenuItem
            onClick={() => {
              toggleSuspension(menuFor!.person);
              closeMenu();
            }}
          >
            {menuFor?.person.status === 'suspended' ? 'Reinstate' : 'Suspend access'}
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
        {can('recruiter:manage') && (
          <MenuItem
            sx={{ color: 'error.main' }}
            onClick={() => {
              setRemoving(menuFor!.person);
              closeMenu();
            }}
          >
            Remove from recruiting team
          </MenuItem>
        )}
      </Menu>

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
            They stop being able to post jobs or see candidates for{' '}
            {membership.company.name}. Jobs they already posted and the applications on them stay
            with the company.
          </DialogContentText>
          {remove.error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {(remove.error as Error).message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoving(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            disabled={remove.isPending}
            onClick={() =>
              removing &&
              remove.mutate(removing.id, {
                onSuccess: () => {
                  setNotice(`${removing.name} was removed from the recruiting team.`);
                  setRemoving(null);
                },
              })
            }
          >
            {remove.isPending ? 'Removing…' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      <InviteMemberDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        membership={membership}
        limitRoles={RECRUITING_ROLES}
        title={`Invite a recruiter to ${membership.company.name}`}
        description="They get a single-use link that expires. They can act for this company only once they accept."
        isPending={invite.isPending}
        error={invite.error as Error | null}
        onSubmit={(values) =>
          invite.mutateAsync({
            email: values.email,
            role: values.role,
            associationType: values.associationType || undefined,
            jobTitle: values.jobTitle || undefined,
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

export default CompanyRecruiters;

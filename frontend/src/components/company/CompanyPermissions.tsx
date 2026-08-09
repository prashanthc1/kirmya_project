'use client';

/**
 * Per-member permission editor.
 *
 * Two lists are shown and only one of them is editable. What the member's role
 * already carries is read-only, because changing that means changing the role.
 * What was granted to them individually is the editable set, and saving
 * replaces it outright — which is why the dialog refuses to open without having
 * read the current value first.
 *
 * A permission the editor does not hold themselves is shown disabled: the
 * server rejects granting it, and offering it would produce a failed save with
 * no explanation.
 */
import React from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';

import { usePermissionCatalog, useSetMemberPermissions } from '../../features/company/hooks';
import { permissionLabel, roleLabel } from '../../features/company/permissions';
import { CompanyPermission, CompanyPerson, RoleDescriptor } from '../../features/company/types';

/** Groups `team:invite` under "Team", so 30 checkboxes read as seven topics. */
const GROUP_LABELS: Record<string, string> = {
  company: 'Company profile',
  branding: 'Branding',
  settings: 'Settings',
  verification: 'Verification',
  team: 'Team',
  people: 'People',
  permission: 'Permissions',
  recruiter: 'Recruiters',
  job: 'Jobs',
  application: 'Applications',
  analytics: 'Analytics',
  audit: 'Audit log',
  ai: 'Insights',
  update: 'Company updates',
  review: 'Reviews',
};

const groupOf = (permission: CompanyPermission) => permission.split(':')[0];

interface CompanyPermissionsProps {
  companyId: string;
  person: CompanyPerson;
  /** What the acting user holds. Anything outside it cannot be granted. */
  actorPermissions: CompanyPermission[];
  onClose: () => void;
  onSaved?: (name: string) => void;
}

export const CompanyPermissions: React.FC<CompanyPermissionsProps> = ({
  companyId,
  person,
  actorPermissions,
  onClose,
  onSaved,
}) => {
  const { data: catalog, isLoading, isError, error } = usePermissionCatalog();
  const save = useSetMemberPermissions(companyId);

  const [selected, setSelected] = React.useState<CompanyPermission[]>(
    person.extraPermissions ?? []
  );

  const roleGrants = React.useMemo<CompanyPermission[]>(() => {
    if (!catalog) return [];
    const roles = person.roles?.length ? person.roles : [person.role];
    const found = new Set<CompanyPermission>();
    roles.forEach((role) => {
      const descriptor = catalog.find((entry: RoleDescriptor) => entry.role === role);
      descriptor?.permissions.forEach((permission) => found.add(permission));
    });
    return Array.from(found);
  }, [catalog, person.role, person.roles]);

  const everyPermission = React.useMemo<CompanyPermission[]>(() => {
    const found = new Set<CompanyPermission>();
    catalog?.forEach((entry) => entry.permissions.forEach((permission) => found.add(permission)));
    // Anything already granted stays visible even if no role lists it, so a
    // stale grant can be seen and removed rather than being invisible.
    selected.forEach((permission) => found.add(permission));
    return Array.from(found).sort();
  }, [catalog, selected]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, CompanyPermission[]>();
    everyPermission.forEach((permission) => {
      const key = groupOf(permission);
      map.set(key, [...(map.get(key) ?? []), permission]);
    });
    return Array.from(map.entries());
  }, [everyPermission]);

  const toggle = (permission: CompanyPermission) =>
    setSelected((previous) =>
      previous.includes(permission)
        ? previous.filter((entry) => entry !== permission)
        : [...previous, permission]
    );

  // The list is what the member has *in addition* to the role, so a permission
  // the role already carries is not stored again.
  const payload = selected.filter((permission) => !roleGrants.includes(permission));

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
      <DialogTitle>
        Permissions for {person.name}
        <Typography variant="body2" color="text.secondary">
          {(person.roles?.length ? person.roles : [person.role]).map(roleLabel).join(', ')}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error?.message || 'The permission catalogue could not be loaded.'}
          </Alert>
        )}
        {save.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {(save.error as Error).message}
          </Alert>
        )}

        {isLoading ? (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress size={24} />
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Alert severity="info">
              Ticked permissions the role already carries are shown for context and cannot be
              removed here — change the role instead. Only the extras are saved.
            </Alert>

            {grouped.map(([group, permissions]) => (
              <div key={group}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {GROUP_LABELS[group] ?? group}
                </Typography>
                <Divider sx={{ my: 0.5 }} />
                <Stack>
                  {permissions.map((permission) => {
                    const fromRole = roleGrants.includes(permission);
                    const actorHolds = actorPermissions.includes(permission);
                    const disabled = fromRole || !actorHolds;
                    const control = (
                      <FormControlLabel
                        key={permission}
                        disabled={disabled}
                        control={
                          <Checkbox
                            size="small"
                            checked={fromRole || selected.includes(permission)}
                            onChange={() => toggle(permission)}
                          />
                        }
                        label={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <span>{permissionLabel(permission)}</span>
                            {fromRole && <Chip size="small" label="From role" variant="outlined" />}
                          </Stack>
                        }
                      />
                    );
                    if (fromRole || actorHolds) return control;
                    return (
                      <Tooltip
                        key={permission}
                        title="You do not hold this permission, so you cannot grant it"
                        placement="right"
                      >
                        <span>{control}</span>
                      </Tooltip>
                    );
                  })}
                </Stack>
              </div>
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={save.isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={save.isPending || isLoading}
          onClick={() =>
            save.mutate(
              { memberId: person.id, permissions: payload },
              {
                onSuccess: () => {
                  onSaved?.(person.name);
                  onClose();
                },
              }
            )
          }
        >
          {save.isPending ? 'Saving…' : `Save ${payload.length} extra`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompanyPermissions;

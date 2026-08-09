'use client';

/**
 * Company settings: the switches that change how the company behaves on
 * Kirmya, rather than what its profile says.
 *
 * The audit log is here because it is the answer to "who changed this" — every
 * administrative action in this module writes to it, and reading it is its own
 * permission.
 */
import React from 'react';
import NextLink from 'next/link';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  Link as MuiLink,
  Pagination,
  Skeleton,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { useAuditLog, useUpdateCompany } from '../../features/company/hooks';
import { AuditEntry, CompanyDetail, CompanyMembership } from '../../features/company/types';
import GlassPanel from './GlassPanel';
import { VerificationStatusChip } from './CompanyBadges';

/** `company.updated` reads better than `COMPANY_UPDATED` in a table. */
const humanizeAction = (action: string) =>
  action.replace(/[._]/g, ' ').replace(/^\w/, (character) => character.toUpperCase());

interface CompanySettingsProps {
  company: CompanyDetail;
  membership: CompanyMembership;
}

export const CompanySettings: React.FC<CompanySettingsProps> = ({ company, membership }) => {
  const canEdit = membership.permissions.includes('settings:edit');
  const canViewAudit = membership.permissions.includes('audit:view');

  const save = useUpdateCompany(company.id);
  const [isHiring, setIsHiring] = React.useState(company.isHiring);
  const [notice, setNotice] = React.useState('');

  const toggleHiring = (next: boolean) => {
    setIsHiring(next);
    save.mutate(
      { isHiring: next },
      {
        onSuccess: () =>
          setNotice(
            next
              ? 'The company is shown as actively hiring.'
              : 'The hiring badge was removed from the company page.'
          ),
        // Put the switch back if the server refused, so it never shows a state
        // that was not saved.
        onError: () => setIsHiring(!next),
      }
    );
  };

  return (
    <Stack spacing={3}>
      {!canEdit && (
        <Alert severity="info" sx={{ borderRadius: '16px' }}>
          You can see these settings but not change them.
        </Alert>
      )}
      {save.error && (
        <Alert severity="error" sx={{ borderRadius: '16px' }}>
          {(save.error as Error).message}
        </Alert>
      )}

      <GlassPanel title="Public presence">
        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Switch
                checked={isHiring}
                disabled={!canEdit || save.isPending}
                onChange={(event) => toggleHiring(event.target.checked)}
              />
            }
            label="Show this company as actively hiring"
          />
          <Typography variant="body2" color="text.secondary">
            The badge appears in search and on the company page. Open jobs are listed either way —
            this only affects the badge.
          </Typography>

          <Divider />

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="body2" color="text.secondary">
              Public address:
            </Typography>
            <MuiLink component={NextLink} href={`/company/${company.slug}`} underline="hover">
              /company/{company.slug}
            </MuiLink>
            <Chip size="small" variant="outlined" label="Fixed at creation" />
          </Stack>
        </Stack>
      </GlassPanel>

      <GlassPanel
        title="Verification"
        description="Only a Kirmya administrator can verify a company. Nothing on this page grants the badge."
      >
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          <VerificationStatusChip status={company.verificationStatus} />
          {membership.permissions.includes('verification:view') && (
            <Button
              component={NextLink}
              href="/company/dashboard/verification"
              size="small"
              variant="outlined"
              sx={{ textTransform: 'none' }}
            >
              Open verification
            </Button>
          )}
        </Stack>
      </GlassPanel>

      <GlassPanel
        title="Who can do what"
        description="Access is granted per person, per company. Nobody at another company can see or change anything here."
      >
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            component={NextLink}
            href="/company/dashboard/people"
            size="small"
            variant="outlined"
            sx={{ textTransform: 'none' }}
          >
            Team and permissions
          </Button>
          <Button
            component={NextLink}
            href="/company/dashboard/recruiters"
            size="small"
            variant="outlined"
            sx={{ textTransform: 'none' }}
          >
            Recruiters
          </Button>
        </Stack>
      </GlassPanel>

      {canViewAudit && <AuditLogPanel companyId={company.id} />}

      <Snackbar
        open={!!notice}
        autoHideDuration={4000}
        onClose={() => setNotice('')}
        message={notice}
      />
    </Stack>
  );
};

const AuditLogPanel: React.FC<{ companyId: string }> = ({ companyId }) => {
  const [page, setPage] = React.useState(1);
  const limit = 20;
  const { data, isLoading, isError, error } = useAuditLog(companyId, { page, limit });

  const entries: AuditEntry[] = data?.items ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / limit));

  return (
    <GlassPanel
      title="Activity log"
      description="Every administrative action taken on this company, newest first."
    >
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {(error as Error)?.message || 'The activity log could not be loaded.'}
        </Alert>
      )}

      {isLoading ? (
        <Stack spacing={1}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={40} />
          ))}
        </Stack>
      ) : entries.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Nothing has been recorded for this company yet.
        </Typography>
      ) : (
        <>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" aria-label="Company activity log">
              <TableHead>
                <TableRow>
                  <TableCell>When</TableCell>
                  <TableCell>Who</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Target</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(entry.createdAt).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>{entry.actorName || 'System'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{humanizeAction(entry.action)}</TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {entry.resourceType}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {totalPages > 1 && (
            <Stack alignItems="center" sx={{ pt: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                shape="rounded"
              />
            </Stack>
          )}
        </>
      )}
    </GlassPanel>
  );
};

export default CompanySettings;

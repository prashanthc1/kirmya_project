'use client';

/**
 * Shell for every company back-office screen.
 *
 * It answers one question before anything else renders: which company is this
 * caller acting for, and what may they do there. The answer comes from
 * `GET /companies/mine`, so a company the user has no standing in cannot be
 * selected by editing the URL — an unknown `?company=` value resolves to
 * nothing rather than to the first company in the list.
 *
 * The navigation is filtered by the same permissions, but hiding a link is
 * presentation only: each screen re-checks, and the server checks again.
 */
import React from 'react';
import NextLink from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Container,
  Divider,
  MenuItem,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import SpaceDashboardOutlinedIcon from '@mui/icons-material/SpaceDashboardOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AddBusinessOutlinedIcon from '@mui/icons-material/AddBusinessOutlined';

import { useMyCompanies } from '../../features/company/hooks';
import { CompanyMembership, CompanyPermission } from '../../features/company/types';
import { hasPermission, roleLabel } from '../../features/company/permissions';
import useAuth from '../../hooks/useAuth';
import { VerificationStatusChip } from './CompanyBadges';

export interface DashboardContext {
  membership: CompanyMembership;
  companyId: string;
  /** True when the membership carries `permission`. */
  can: (permission: CompanyPermission) => boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  permission: CompanyPermission | CompanyPermission[];
}

const NAV: NavItem[] = [
  {
    href: '/company/dashboard',
    label: 'Overview',
    icon: <SpaceDashboardOutlinedIcon fontSize="small" />,
    permission: 'company:view',
  },
  {
    href: '/company/dashboard/profile',
    label: 'Profile',
    icon: <BusinessOutlinedIcon fontSize="small" />,
    permission: ['company:edit', 'branding:edit'],
  },
  {
    href: '/company/dashboard/jobs',
    label: 'Jobs',
    icon: <WorkOutlineIcon fontSize="small" />,
    permission: 'job:view',
  },
  {
    href: '/company/dashboard/people',
    label: 'People',
    icon: <GroupsOutlinedIcon fontSize="small" />,
    permission: 'team:view',
  },
  {
    href: '/company/dashboard/recruiters',
    label: 'Recruiters',
    icon: <BadgeOutlinedIcon fontSize="small" />,
    permission: 'recruiter:view',
  },
  {
    href: '/company/dashboard/analytics',
    label: 'Analytics',
    icon: <InsightsOutlinedIcon fontSize="small" />,
    permission: 'analytics:view',
  },
  {
    href: '/company/dashboard/verification',
    label: 'Verification',
    icon: <VerifiedUserOutlinedIcon fontSize="small" />,
    permission: 'verification:view',
  },
  {
    href: '/company/dashboard/settings',
    label: 'Settings',
    icon: <SettingsOutlinedIcon fontSize="small" />,
    permission: 'settings:edit',
  },
];

const allows = (permissions: CompanyPermission[], required: NavItem['permission']) =>
  Array.isArray(required)
    ? required.some((permission) => permissions.includes(permission))
    : permissions.includes(required);

interface CompanyDashboardShellProps {
  title: string;
  description?: string;
  /** Rendered only when the caller holds this permission on the active company. */
  requires?: CompanyPermission | CompanyPermission[];
  actions?: (context: DashboardContext) => React.ReactNode;
  children: (context: DashboardContext) => React.ReactNode;
}

export const CompanyDashboardShell: React.FC<CompanyDashboardShellProps> = ({
  title,
  description,
  requires,
  actions,
  children,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const requested = searchParams?.get('company') ?? '';
  const { data: memberships, isLoading, isError, error } = useMyCompanies({
    enabled: isAuthenticated,
  });

  const active = React.useMemo<CompanyMembership | undefined>(() => {
    if (!memberships || memberships.length === 0) return undefined;
    if (requested) {
      return memberships.find(
        (item) => item.company.slug === requested || item.company.id === requested
      );
    }
    return memberships[0];
  }, [memberships, requested]);

  const switchCompany = (slug: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('company', slug);
    router.replace(`${pathname}?${params.toString()}`);
  };

  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton variant="text" width={260} height={48} />
        <Skeleton variant="rounded" height={420} sx={{ mt: 3, borderRadius: '20px' }} />
      </Container>
    );
  }

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Alert severity="info" sx={{ borderRadius: '16px' }}>
          <AlertTitle>Sign in to manage a company</AlertTitle>
          The company dashboard is only available to the people a company has added to its team.
          <Box sx={{ mt: 2 }}>
            <Button
              component={NextLink}
              href={`/signin?redirect=${encodeURIComponent('/company/dashboard')}`}
              variant="contained"
              size="small"
            >
              Sign in
            </Button>
          </Box>
        </Alert>
      </Container>
    );
  }

  if (isError) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Alert severity="error" sx={{ borderRadius: '16px' }}>
          {error?.message || 'Your companies could not be loaded.'}
        </Alert>
      </Container>
    );
  }

  if (!memberships || memberships.length === 0) {
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Stack spacing={2} alignItems="flex-start">
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            You do not manage a company yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            A company appears here once you create one, or once an administrator at an existing
            company approves you as a member. Asking to be listed as an employee does not by itself
            grant access.
          </Typography>
          <Button
            component={NextLink}
            href="/company/create"
            variant="contained"
            startIcon={<AddBusinessOutlinedIcon />}
          >
            Create a company page
          </Button>
        </Stack>
      </Container>
    );
  }

  if (!active) {
    // A `?company=` value that is not in the caller's list. Naming it back would
    // confirm it exists, so the message stays about the caller's own access.
    return (
      <Container maxWidth="sm" sx={{ py: 10 }}>
        <Alert severity="warning" sx={{ borderRadius: '16px' }}>
          <AlertTitle>No access to that company</AlertTitle>
          You are not a member of the company in this link.
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => switchCompany(memberships[0].company.slug)}
            >
              Open {memberships[0].company.name}
            </Button>
          </Box>
        </Alert>
      </Container>
    );
  }

  const permissions = active.permissions ?? [];
  const context: DashboardContext = {
    membership: active,
    companyId: active.company.id,
    can: (permission) => hasPermission(active, permission),
  };
  const visibleNav = NAV.filter((item) => allows(permissions, item.permission));
  const permitted = requires ? allows(permissions, requires) : true;

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        alignItems={{ md: 'flex-start' }}
      >
        <Box
          component="nav"
          aria-label="Company dashboard"
          sx={{
            width: { xs: '100%', md: 264 },
            flexShrink: 0,
            p: 2,
            borderRadius: '20px',
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.12)',
            bgcolor: isDark ? 'rgba(15, 23, 42, 0.55)' : 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(16px)',
            position: { md: 'sticky' },
            top: { md: 24 },
          }}
        >
          {memberships.length > 1 ? (
            <TextField
              select
              fullWidth
              size="small"
              label="Company"
              value={active.company.slug}
              onChange={(event) => switchCompany(event.target.value)}
            >
              {memberships.map((item) => (
                <MenuItem key={item.company.id} value={item.company.slug}>
                  {item.company.name}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }} noWrap>
              {active.company.name}
            </Typography>
          )}

          <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }} useFlexGap>
            <VerificationStatusChip status={active.company.verificationStatus} />
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            You are {active.roles.map(roleLabel).join(', ') || 'a member'} here
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={0.5}>
            {visibleNav.map((item) => {
              const selected = pathname === item.href;
              return (
                <Button
                  key={item.href}
                  component={NextLink}
                  href={`${item.href}?company=${active.company.slug}`}
                  startIcon={item.icon}
                  aria-current={selected ? 'page' : undefined}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    fontWeight: selected ? 700 : 500,
                    color: selected ? 'primary.main' : 'text.primary',
                    bgcolor: selected
                      ? isDark
                        ? 'rgba(99, 102, 241, 0.18)'
                        : 'rgba(99, 102, 241, 0.1)'
                      : 'transparent',
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Button
            component={NextLink}
            href={`/company/${active.company.slug}`}
            size="small"
            fullWidth
            variant="outlined"
            sx={{ textTransform: 'none' }}
          >
            View public page
          </Button>
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ sm: 'center' }}
            sx={{ mb: 3 }}
          >
            <Box>
              <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }}>
                {title}
              </Typography>
              {description && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {description}
                </Typography>
              )}
            </Box>
            {permitted && actions?.(context)}
          </Stack>

          {permitted ? (
            children(context)
          ) : (
            <Alert severity="warning" sx={{ borderRadius: '16px' }}>
              <AlertTitle>Not available to your role</AlertTitle>
              Your roles at {active.company.name} do not include access to this section. An
              administrator there can change that.
            </Alert>
          )}
        </Box>
      </Stack>
    </Container>
  );
};

export default CompanyDashboardShell;

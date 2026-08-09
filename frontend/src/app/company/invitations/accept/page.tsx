'use client';

/**
 * The landing page for a company invitation link.
 *
 * The token in the query string is the credential. The server stores only its
 * hash, checks that it has not expired or been revoked, and checks that the
 * signed-in account is the one that was invited — this page shows the outcome
 * and never decides it. Nothing is accepted just by opening the link.
 */
import React from 'react';
import NextLink from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  AlertTitle,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';

import GlassPanel from '../../../../components/company/GlassPanel';
import { VerificationStatusChip } from '../../../../components/company/CompanyBadges';
import {
  useAcceptInvitation,
  useDeclineInvitation,
  useInvitationPreview,
} from '../../../../features/company/hooks';
import { roleLabel } from '../../../../features/company/permissions';
import { ASSOCIATION_LABELS } from '../../../../features/company/types';
import useAuth from '../../../../hooks/useAuth';

const InvitationView: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get('token') ?? '';
  const { isAuthenticated, loading: authLoading } = useAuth();

  const preview = useInvitationPreview(token, { enabled: !!token && isAuthenticated });
  const accept = useAcceptInvitation();
  const decline = useDeclineInvitation();
  const [declined, setDeclined] = React.useState(false);

  if (!token) {
    return (
      <Alert severity="error" sx={{ borderRadius: '16px' }}>
        <AlertTitle>This link is incomplete</AlertTitle>
        The invitation link is missing its token. Ask whoever invited you to send it again.
      </Alert>
    );
  }

  if (authLoading) {
    return <Skeleton variant="rounded" height={320} sx={{ borderRadius: '20px' }} />;
  }

  if (!isAuthenticated) {
    // The invitation is bound to an email address, so it can only be resolved
    // for a signed-in account. Coming back here after signing in keeps the token.
    const redirect = `/company/invitations/accept?token=${encodeURIComponent(token)}`;
    return (
      <Alert severity="info" sx={{ borderRadius: '16px' }}>
        <AlertTitle>Sign in to see this invitation</AlertTitle>
        Invitations are issued to a specific address, so you need to be signed in as the person who
        was invited.
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button
            component={NextLink}
            href={`/signin?redirect=${encodeURIComponent(redirect)}`}
            variant="contained"
            size="small"
          >
            Sign in
          </Button>
          <Button
            component={NextLink}
            href={`/signup?redirect=${encodeURIComponent(redirect)}`}
            variant="outlined"
            size="small"
          >
            Create an account
          </Button>
        </Stack>
      </Alert>
    );
  }

  if (preview.isLoading) {
    return <Skeleton variant="rounded" height={320} sx={{ borderRadius: '20px' }} />;
  }

  if (preview.isError || !preview.data) {
    return (
      <Alert severity="error" sx={{ borderRadius: '16px' }}>
        <AlertTitle>This invitation cannot be opened</AlertTitle>
        {preview.error?.message ||
          'It may have expired, been revoked, or been issued to a different account.'}
        <Box sx={{ mt: 2 }}>
          <Button component={NextLink} href="/company" variant="outlined" size="small">
            Browse companies
          </Button>
        </Box>
      </Alert>
    );
  }

  const { invitation, company } = preview.data;
  const expired = new Date(invitation.expiresAt).getTime() < Date.now();
  const open = invitation.status === 'pending' && !expired;

  if (declined) {
    return (
      <Alert severity="success" sx={{ borderRadius: '16px' }}>
        <AlertTitle>Invitation declined</AlertTitle>
        {company.name} has not been given access to anything of yours, and the link no longer
        works.
        <Box sx={{ mt: 2 }}>
          <Button component={NextLink} href="/company" variant="outlined" size="small">
            Browse companies
          </Button>
        </Box>
      </Alert>
    );
  }

  return (
    <Stack spacing={3}>
      <GlassPanel>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={company.logoUrl || undefined}
            alt=""
            variant="rounded"
            sx={{ width: 64, height: 64 }}
          >
            <BusinessOutlinedIcon />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 800 }} noWrap>
              {company.name}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} flexWrap="wrap" useFlexGap>
              <VerificationStatusChip status={company.verificationStatus} />
              {company.industry && <Chip size="small" variant="outlined" label={company.industry} />}
            </Stack>
          </Box>
        </Stack>

        <Divider sx={{ my: 2.5 }} />

        <Typography variant="body1">
          You have been invited to join {company.name} as{' '}
          <strong>{roleLabel(invitation.role)}</strong>
          {invitation.jobTitle ? ` (${invitation.jobTitle})` : ''}.
        </Typography>

        {invitation.message && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1.5, whiteSpace: 'pre-line', fontStyle: 'italic' }}
          >
            “{invitation.message}”
          </Typography>
        )}

        <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={`Invited: ${invitation.email}`} />
          {invitation.associationType && (
            <Chip
              size="small"
              variant="outlined"
              label={ASSOCIATION_LABELS[invitation.associationType] ?? invitation.associationType}
            />
          )}
          <Chip
            size="small"
            variant="outlined"
            color={expired ? 'error' : 'default'}
            label={`${expired ? 'Expired' : 'Expires'} ${new Date(
              invitation.expiresAt
            ).toLocaleDateString()}`}
          />
        </Stack>
      </GlassPanel>

      {!open && (
        <Alert severity="warning" sx={{ borderRadius: '16px' }}>
          <AlertTitle>This invitation is no longer open</AlertTitle>
          {expired
            ? 'It passed its expiry date. Ask the company to send a new one.'
            : `It was already ${invitation.status}.`}
        </Alert>
      )}

      {accept.isError && (
        <Alert severity="error" sx={{ borderRadius: '16px' }}>
          {(accept.error as Error).message}
        </Alert>
      )}
      {decline.isError && (
        <Alert severity="error" sx={{ borderRadius: '16px' }}>
          {(decline.error as Error).message}
        </Alert>
      )}

      <Alert severity="info" sx={{ borderRadius: '16px' }}>
        Accepting gives you the permissions of this role at {company.name} only. It does not share
        your profile, your applications or your messages with anyone.
      </Alert>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Button
          variant="contained"
          size="large"
          disabled={!open || accept.isPending || decline.isPending}
          onClick={() =>
            accept.mutate(token, {
              onSuccess: () =>
                router.push(`/company/dashboard?company=${encodeURIComponent(company.slug)}`),
            })
          }
          sx={{ textTransform: 'none' }}
        >
          {accept.isPending ? 'Joining…' : `Join ${company.name}`}
        </Button>
        <Button
          variant="outlined"
          size="large"
          color="inherit"
          disabled={!open || accept.isPending || decline.isPending}
          onClick={() => decline.mutate(token, { onSuccess: () => setDeclined(true) })}
          sx={{ textTransform: 'none' }}
        >
          {decline.isPending ? 'Declining…' : 'Decline'}
        </Button>
      </Stack>
    </Stack>
  );
};

export default function AcceptInvitationPage() {
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 8 } }}>
      <React.Suspense
        fallback={<Skeleton variant="rounded" height={320} sx={{ borderRadius: '20px' }} />}
      >
        <InvitationView />
      </React.Suspense>
    </Container>
  );
}

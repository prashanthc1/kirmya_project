'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Link as MuiLink,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { freelanceApi } from '../../features/freelance/api';
import { freelanceErrorMessage } from '../../features/freelance/errors';
import type { PayoutAccountView } from '../../features/freelance/types';
import { routes } from '../../shared/routes';
import { PAYOUT_ACCOUNT_STATUS, PAYOUT_STATUS, formatDate, formatMoney } from './escrowFormat';

const PAGE_SIZE = 20;

/** Why setting up payouts was refused, in words. */
function onboardingError(err: unknown): string {
  const response = (err as { response?: { status?: number; data?: { code?: string } } })?.response;
  if (response?.data?.code === 'FREELANCE_PAYMENTS_UNAVAILABLE') {
    return 'Payouts are not available yet. Money released to you is kept safe and will be sent once they are.';
  }
  if (response?.status === 403) {
    return 'Payouts are for freelancers. Set up your freelancer profile first.';
  }
  return freelanceErrorMessage(err, 'Payout setup could not be started. Please try again.');
}

/**
 * The freelancer's payout account and the payouts sent to it.
 *
 * Identity and bank details are given to the payment processor on its own
 * pages; this screen only sends the freelancer there and shows what the
 * processor said back.
 */
export default function PayoutsView() {
  const queryClient = useQueryClient();
  const [page, setPage] = React.useState(1);
  // Where the processor's onboarding sent the freelancer back from.
  const onboardingReturn = useSearchParams()?.get('onboarding');
  const [notice, setNotice] = React.useState<{ severity: 'success' | 'info' | 'error'; text: string } | null>(() =>
    onboardingReturn === 'refresh'
      ? { severity: 'info', text: 'That setup link expired. Continue setup to get a new one.' }
      : null
  );

  const accountKey = ['freelance', 'payouts', 'account'];
  const account = useQuery({ queryKey: accountKey, queryFn: () => freelanceApi.getPayoutAccount() });
  const payouts = useQuery({
    queryKey: ['freelance', 'payouts', 'list', page],
    queryFn: () => freelanceApi.listPayouts(page, PAGE_SIZE),
  });

  const settle = (view: PayoutAccountView) => {
    queryClient.setQueryData(accountKey, view);
    queryClient.invalidateQueries({ queryKey: ['freelance', 'payouts', 'list'] });
  };

  const refresh = useMutation({
    mutationFn: () => freelanceApi.refreshPayoutAccount(),
    onSuccess: view => {
      settle(view);
      setNotice(
        view.status === 'enabled'
          ? { severity: 'success', text: 'Payouts are set up. Money released to you is sent automatically.' }
          : { severity: 'info', text: PAYOUT_ACCOUNT_STATUS[view.status].explanation }
      );
    },
    onError: err => setNotice({ severity: 'error', text: freelanceErrorMessage(err, 'Your payout account could not be checked. Please try again.') }),
  });

  const start = useMutation({
    mutationFn: () => freelanceApi.startPayoutOnboarding(),
    onSuccess: result => {
      if (result.url) {
        window.location.assign(result.url);
        return;
      }
      settle(result.account);
      setNotice({ severity: 'success', text: 'Payouts are set up. Money released to you is sent automatically.' });
    },
    onError: err => setNotice({ severity: 'error', text: onboardingError(err) }),
  });

  // Back from onboarding: ask the processor where the account stands now,
  // rather than wait for its webhook. Once per visit.
  const refreshedOnReturn = React.useRef(false);
  const { mutate: refreshAccount } = refresh;
  React.useEffect(() => {
    if (onboardingReturn === 'return' && !refreshedOnReturn.current) {
      refreshedOnReturn.current = true;
      refreshAccount();
    }
  }, [onboardingReturn, refreshAccount]);

  const view = account.data;
  const busy = start.isPending || refresh.isPending;
  const waiting = Object.entries(view?.waiting ?? {}).filter(([, amount]) => amount > 0);

  return (
    <Box sx={{ py: 4 }}>
      <MuiLink component={Link} href={routes.freelance.home()} underline="hover" sx={{ display: 'inline-flex', gap: 0.5, mb: 2 }}>
        <ArrowBackIcon fontSize="small" /> Freelance
      </MuiLink>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
        Payouts
      </Typography>
      <Typography variant="body2" color="text.secondary">
        When a client approves a milestone, its money is sent to your payout account.
      </Typography>

      {notice && (
        <Alert severity={notice.severity} onClose={() => setNotice(null)} sx={{ mt: 3 }}>
          {notice.text}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
        {account.isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress aria-label="Loading your payout account" />
          </Box>
        ) : account.error || !view ? (
          <Alert severity="error">{freelanceErrorMessage(account.error, 'Your payout account could not be loaded.')}</Alert>
        ) : !view.available ? (
          <Alert severity="info">
            Payouts are not available yet. Money released to you is kept safe and will be sent once they are.
          </Alert>
        ) : (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" component="h2">
                  Payout account
                </Typography>
                <Chip size="small" label={PAYOUT_ACCOUNT_STATUS[view.status].label} color={PAYOUT_ACCOUNT_STATUS[view.status].color} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {PAYOUT_ACCOUNT_STATUS[view.status].explanation}
              </Typography>
              {waiting.length > 0 && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Waiting to be sent: {waiting.map(([currency, amount]) => formatMoney(amount, currency)).join(', ')}
                </Typography>
              )}
            </Box>
            {view.status === 'not_started' && (
              <Button variant="contained" onClick={() => start.mutate()} disabled={busy}>
                Set up payouts
              </Button>
            )}
            {(view.status === 'onboarding' || view.status === 'action_required') && (
              <Button variant="contained" onClick={() => start.mutate()} disabled={busy}>
                Continue setup
              </Button>
            )}
            {view.status === 'in_review' && (
              <Button variant="outlined" onClick={() => refresh.mutate()} disabled={busy}>
                Check status
              </Button>
            )}
          </Stack>
        )}
      </Paper>

      <Typography variant="h6" component="h2" sx={{ mt: 4, mb: 1 }}>
        Payout history
      </Typography>
      {payouts.isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress aria-label="Loading payouts" />
        </Box>
      ) : payouts.error ? (
        <Alert severity="error">{freelanceErrorMessage(payouts.error, 'Your payouts could not be loaded.')}</Alert>
      ) : !payouts.data || payouts.data.data.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No payouts yet. They appear here when a client approves your work.</Typography>
        </Paper>
      ) : (
        <>
          <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Released</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Sent on</TableCell>
                  <TableCell>Contract</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payouts.data.data.map(p => (
                  <TableRow key={p.id}>
                    <TableCell>{formatDate(p.created_at)}</TableCell>
                    <TableCell align="right">{formatMoney(p.amount, p.currency)}</TableCell>
                    <TableCell>
                      <Chip size="small" label={PAYOUT_STATUS[p.status]?.label ?? p.status} color={PAYOUT_STATUS[p.status]?.color ?? 'default'} />
                    </TableCell>
                    <TableCell>{formatDate(p.paid_at)}</TableCell>
                    <TableCell>
                      {p.contract_id && (
                        <MuiLink component={Link} href={routes.freelance.contract(p.contract_id)}>
                          View contract
                        </MuiLink>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
          {payouts.data.total_pages > 1 && (
            <Pagination sx={{ mt: 2 }} page={page} count={payouts.data.total_pages} onChange={(_, p) => setPage(p)} />
          )}
        </>
      )}
    </Box>
  );
}

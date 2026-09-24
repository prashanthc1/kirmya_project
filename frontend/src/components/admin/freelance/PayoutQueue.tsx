'use client';

import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import { freelanceAdminApi } from '../../../features/freelance/api';
import { freelanceErrorMessage } from '../../../features/freelance/errors';
import { PAYOUT_STATUS, formatDate, formatMoney } from '../../freelance/escrowFormat';

const FILTERS = [
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Waiting to be sent' },
  { value: 'processing', label: 'Sending' },
  { value: 'paid', label: 'Sent' },
  { value: 'all', label: 'All' },
];

const PAGE_SIZE = 20;

/**
 * Freelance payouts, oldest first. The default view is the failed ones: each
 * is money a freelancer has earned and not received, and sending stopped until
 * somebody fixes the cause and retries it.
 */
export default function PayoutQueue() {
  const queryClient = useQueryClient();
  const [status, setStatus] = React.useState('failed');
  const [page, setPage] = React.useState(1);
  const [notice, setNotice] = React.useState<{ severity: 'success' | 'error'; text: string } | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'freelance', 'payouts', status, page],
    queryFn: () => freelanceAdminApi.listPayouts(status, page, PAGE_SIZE),
  });

  const retry = useMutation({
    mutationFn: (payoutID: string) => freelanceAdminApi.retryPayout(payoutID),
    onSuccess: () => {
      setNotice({ severity: 'success', text: 'The payout is back in the queue and will be sent shortly.' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'freelance', 'payouts'] });
    },
    onError: err => setNotice({ severity: 'error', text: freelanceErrorMessage(err, 'The payout could not be retried.') }),
  });

  return (
    <Box sx={{ py: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Freelance payouts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            A failed payout stopped after repeated attempts. Fix the cause shown, then retry it.
          </Typography>
        </Box>
        <TextField
          select
          size="small"
          label="Show"
          value={status}
          onChange={e => {
            setStatus(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 220 }}
        >
          {FILTERS.map(f => (
            <MenuItem key={f.value} value={f.value}>
              {f.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {notice && (
        <Alert severity={notice.severity} onClose={() => setNotice(null)} sx={{ mb: 2 }}>
          {notice.text}
        </Alert>
      )}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress aria-label="Loading payouts" />
        </Box>
      ) : error ? (
        <Alert severity="error">{freelanceErrorMessage(error, 'The payout queue could not be loaded.')}</Alert>
      ) : !data || data.data.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {status === 'failed' ? 'No payouts have failed.' : 'No payouts match this filter.'}
          </Typography>
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
                  <TableCell align="right">Attempts</TableCell>
                  <TableCell>Last error</TableCell>
                  <TableCell>Contract</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {data.data.map(p => (
                  <TableRow key={p.id} hover>
                    <TableCell>{formatDate(p.created_at)}</TableCell>
                    <TableCell align="right">{formatMoney(p.amount, p.currency)}</TableCell>
                    <TableCell>
                      <Chip size="small" label={PAYOUT_STATUS[p.status]?.label ?? p.status} color={PAYOUT_STATUS[p.status]?.color ?? 'default'} />
                    </TableCell>
                    <TableCell align="right">{p.attempts}</TableCell>
                    <TableCell sx={{ maxWidth: 320, wordBreak: 'break-word' }}>{p.last_error ?? ''}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{p.contract_id?.slice(0, 8) ?? ''}</TableCell>
                    <TableCell>
                      {p.status === 'failed' && (
                        <Button size="small" variant="outlined" disabled={retry.isPending} onClick={() => retry.mutate(p.id)}>
                          Retry
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
          {data.total_pages > 1 && (
            <Pagination sx={{ mt: 2 }} page={page} count={data.total_pages} onChange={(_, p) => setPage(p)} />
          )}
        </>
      )}
    </Box>
  );
}

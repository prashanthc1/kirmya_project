'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Link as MuiLink,
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
import { routes } from '../../../shared/routes';
import { DISPUTE_REASONS, DISPUTE_STATUS, formatDate } from '../../freelance/escrowFormat';

const FILTERS = [
  { value: 'open', label: 'Awaiting a decision' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'all', label: 'All' },
];

const PAGE_SIZE = 20;

/**
 * The freelance dispute queue, oldest first: the oldest dispute has been
 * waiting longest, and every one of them has a client's money frozen in escrow.
 */
export default function DisputeQueue() {
  const [status, setStatus] = React.useState('open');
  const [page, setPage] = React.useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin', 'freelance', 'disputes', status, page],
    queryFn: () => freelanceAdminApi.listDisputes(status, page, PAGE_SIZE),
  });

  return (
    <Box sx={{ py: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Freelance disputes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Each open dispute has a milestone&apos;s money frozen in escrow until it is decided.
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

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress aria-label="Loading disputes" />
        </Box>
      ) : error ? (
        <Alert severity="error">{freelanceErrorMessage(error, 'The dispute queue could not be loaded.')}</Alert>
      ) : !data || data.data.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {status === 'open' ? 'No disputes are waiting for a decision.' : 'No disputes match this filter.'}
          </Typography>
        </Paper>
      ) : (
        <>
          <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Opened</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Contract</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.data.map(d => (
                  <TableRow key={d.id} hover>
                    <TableCell>
                      <MuiLink component={Link} href={routes.admin.freelanceDispute(d.id)}>
                        {formatDate(d.created_at)}
                      </MuiLink>
                    </TableCell>
                    <TableCell>{DISPUTE_REASONS[d.reason] ?? d.reason}</TableCell>
                    <TableCell>
                      <Chip size="small" label={DISPUTE_STATUS[d.status]?.label ?? d.status} color={DISPUTE_STATUS[d.status]?.color ?? 'default'} />
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{d.contract_id.slice(0, 8)}</TableCell>
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

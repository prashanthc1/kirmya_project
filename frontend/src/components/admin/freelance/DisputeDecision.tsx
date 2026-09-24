'use client';

import React from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  Link as MuiLink,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { freelanceAdminApi } from '../../../features/freelance/api';
import { freelanceErrorMessage } from '../../../features/freelance/errors';
import { OPEN_DISPUTE_STATUSES, type DisputeOutcome } from '../../../features/freelance/types';
import { routes } from '../../../shared/routes';
import {
  DISPUTE_OUTCOMES,
  DISPUTE_REASONS,
  DISPUTE_STATUS,
  MILESTONE_STATUS,
  formatDate,
  formatMoney,
} from '../../freelance/escrowFormat';

/*
 * Deciding one dispute.
 *
 * The decision moves money, so it is deliberate: an outcome and a written
 * resolution, then a confirmation that states what will happen to the money.
 * The resolution is shown to both parties.
 */
export default function DisputeDecision({ disputeID }: { disputeID: string }) {
  const queryClient = useQueryClient();
  const [outcome, setOutcome] = React.useState<DisputeOutcome | ''>('');
  const [resolution, setResolution] = React.useState('');
  const [confirming, setConfirming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const key = ['admin', 'freelance', 'dispute', disputeID];
  const { data: dispute, isLoading, error: loadError } = useQuery({
    queryKey: key,
    queryFn: () => freelanceAdminApi.getDispute(disputeID),
    retry: false,
  });

  const resolve = useMutation({
    mutationFn: () =>
      freelanceAdminApi.resolveDispute(disputeID, {
        outcome: outcome as DisputeOutcome,
        resolution: resolution.trim(),
      }),
    onSuccess: () => {
      setConfirming(false);
      setError(null);
      queryClient.invalidateQueries({ queryKey: key });
      queryClient.invalidateQueries({ queryKey: ['admin', 'freelance', 'disputes'] });
    },
    onError: (err: unknown) => {
      setConfirming(false);
      setError(freelanceErrorMessage(err, 'The decision could not be recorded. Nothing was changed.'));
      queryClient.invalidateQueries({ queryKey: key });
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress aria-label="Loading dispute" />
      </Box>
    );
  }
  if (loadError || !dispute) {
    return <Alert severity="error">{freelanceErrorMessage(loadError, 'This dispute could not be loaded.')}</Alert>;
  }

  const isOpen = OPEN_DISPUTE_STATUSES.includes(dispute.status);
  const m = dispute.milestone;
  const amount = m ? formatMoney(m.amount, m.currency) : 'the escrowed amount';

  return (
    <Box sx={{ py: 4, maxWidth: 880 }}>
      <MuiLink component={Link} href={routes.admin.freelanceDisputes()} underline="hover" sx={{ display: 'inline-flex', gap: 0.5, mb: 2 }}>
        <ArrowBackIcon fontSize="small" /> Dispute queue
      </MuiLink>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          {DISPUTE_REASONS[dispute.reason] ?? dispute.reason}
        </Typography>
        <Chip label={DISPUTE_STATUS[dispute.status]?.label ?? dispute.status} color={DISPUTE_STATUS[dispute.status]?.color ?? 'default'} />
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Opened {formatDate(dispute.created_at)} · contract {dispute.contract_id} · raised by user {dispute.raised_by}
      </Typography>

      <Paper variant="outlined" sx={{ mt: 3, p: 3 }}>
        <Typography variant="overline" color="text.secondary">
          The raiser&apos;s account
        </Typography>
        <Typography sx={{ whiteSpace: 'pre-wrap' }}>{dispute.detail}</Typography>
        {m && (
          <Typography variant="body2" sx={{ mt: 2 }}>
            Milestone <strong>{m.title}</strong> · {amount} ·{' '}
            {MILESTONE_STATUS[m.status]?.label ?? m.status}
          </Typography>
        )}
      </Paper>

      <Typography variant="h6" component="h2" sx={{ mt: 4, mb: 1 }}>
        Evidence ({dispute.evidence.length})
      </Typography>
      <Stack spacing={1.5}>
        {dispute.evidence.map(e => (
          <Paper key={e.id} variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {e.uploaded_by === dispute.raised_by ? 'Raiser' : 'Other party'} · {formatDate(e.created_at)}
            </Typography>
            {e.body && <Typography sx={{ whiteSpace: 'pre-wrap' }}>{e.body}</Typography>}
            {e.file_url && (
              <MuiLink href={e.file_url} target="_blank" rel="noopener noreferrer nofollow" sx={{ wordBreak: 'break-all' }}>
                {e.file_url}
              </MuiLink>
            )}
          </Paper>
        ))}
      </Stack>

      {dispute.status === 'resolved' && dispute.outcome && (
        <Alert severity="success" sx={{ mt: 4 }}>
          <Typography sx={{ fontWeight: 600 }}>Decided: {DISPUTE_OUTCOMES[dispute.outcome].label}</Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {dispute.resolution}
          </Typography>
        </Alert>
      )}

      {isOpen && (
        <Paper variant="outlined" sx={{ mt: 4, p: 3 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
            Decide
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <RadioGroup value={outcome} onChange={e => setOutcome(e.target.value as DisputeOutcome)}>
            {(Object.keys(DISPUTE_OUTCOMES) as DisputeOutcome[]).map(key => (
              <FormControlLabel
                key={key}
                value={key}
                control={<Radio />}
                label={
                  <Box>
                    <Typography>{DISPUTE_OUTCOMES[key].label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {DISPUTE_OUTCOMES[key].explanation}
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: 'flex-start', mb: 1 }}
              />
            ))}
          </RadioGroup>
          <TextField
            label="Resolution (shown to both parties)"
            value={resolution}
            onChange={e => setResolution(e.target.value)}
            multiline
            minRows={3}
            fullWidth
            sx={{ mt: 1 }}
          />
          {confirming ? (
            <Alert
              severity="warning"
              sx={{ mt: 2 }}
              action={
                <Stack direction="row" spacing={1}>
                  <Button color="inherit" size="small" onClick={() => setConfirming(false)} disabled={resolve.isPending}>
                    Back
                  </Button>
                  <Button color="inherit" size="small" variant="outlined" onClick={() => resolve.mutate()} disabled={resolve.isPending}>
                    Confirm decision
                  </Button>
                </Stack>
              }
            >
              {outcome === 'release_to_freelancer' && `${amount} will be released to the freelancer.`}
              {outcome === 'refund_to_client' && `${amount} will be refunded to the client and the milestone cancelled.`}
              {outcome === 'resume_work' && 'No money moves; the freelancer continues the work.'} This cannot be undone.
            </Alert>
          ) : (
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              disabled={outcome === '' || resolution.trim() === ''}
              onClick={() => setConfirming(true)}
            >
              Record decision
            </Button>
          )}
        </Paper>
      )}
    </Box>
  );
}

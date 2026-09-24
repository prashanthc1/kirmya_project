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
  Link as MuiLink,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { freelanceApi } from '../../features/freelance/api';
import { freelanceErrorMessage } from '../../features/freelance/errors';
import {
  OPEN_DISPUTE_STATUSES,
  type DisputeDetail,
  type DisputeEvidence,
  type EvidenceKind,
} from '../../features/freelance/types';
import { useAuth } from '../../hooks/useAuth';
import { routes } from '../../shared/routes';
import {
  DISPUTE_OUTCOMES,
  DISPUTE_REASONS,
  DISPUTE_STATUS,
  MILESTONE_STATUS,
  formatDate,
  formatMoney,
} from './escrowFormat';

/*
 * One dispute, as either party to its contract sees it: what was raised, the
 * milestone it froze, everything both sides submitted, and - once decided -
 * what was decided and why. Both parties see all the evidence: a decision made
 * on evidence one side never saw is not one they can answer.
 */
export default function DisputeView({ disputeID }: { disputeID: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [notice, setNotice] = React.useState<{ severity: 'success' | 'error'; text: string } | null>(null);

  const disputeKey = ['freelance', 'dispute', disputeID];
  const { data: dispute, isLoading, error } = useQuery<DisputeDetail>({
    queryKey: disputeKey,
    queryFn: () => freelanceApi.getDispute(disputeID),
    retry: false,
  });
  // The contract says which side each person is on, so evidence can be labelled
  // "You", "The client" or "The freelancer" rather than with raw ids.
  const { data: contract } = useQuery({
    queryKey: ['freelance', 'contract', dispute?.contract_id],
    queryFn: () => freelanceApi.getContract(dispute!.contract_id),
    enabled: Boolean(dispute?.contract_id),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: disputeKey });
    if (dispute) queryClient.invalidateQueries({ queryKey: ['freelance', 'contract', dispute.contract_id] });
  };

  const withdraw = useMutation({
    mutationFn: () => freelanceApi.withdrawDispute(disputeID),
    onSuccess: () => {
      setNotice({ severity: 'success', text: 'Dispute withdrawn. The milestone is back where it was.' });
      refresh();
    },
    onError: (err: unknown) => {
      setNotice({ severity: 'error', text: freelanceErrorMessage(err, 'The dispute could not be withdrawn.') });
      refresh();
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress aria-label="Loading dispute" />
      </Box>
    );
  }
  if (error || !dispute) {
    return (
      <Alert severity="error" sx={{ my: 4 }}>
        {freelanceErrorMessage(error, 'This dispute could not be loaded.')}
      </Alert>
    );
  }

  const isOpen = OPEN_DISPUTE_STATUSES.includes(dispute.status);
  const isRaiser = user?.id === dispute.raised_by;
  const who = (id: string): string => {
    if (id === user?.id) return 'You';
    if (contract && id === contract.client_id) return 'The client';
    if (contract && id === contract.freelancer_id) return 'The freelancer';
    return 'A party to the contract';
  };
  const status = DISPUTE_STATUS[dispute.status];

  return (
    <Box sx={{ py: 4, maxWidth: 880 }}>
      <MuiLink
        component={Link}
        href={routes.freelance.contract(dispute.contract_id)}
        underline="hover"
        sx={{ display: 'inline-flex', gap: 0.5, mb: 2 }}
      >
        <ArrowBackIcon fontSize="small" /> Back to the contract
      </MuiLink>

      <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          Dispute
        </Typography>
        <Chip label={status?.label ?? dispute.status} color={status?.color ?? 'default'} />
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Raised by {who(dispute.raised_by).toLowerCase()} on {formatDate(dispute.created_at)} ·{' '}
        {DISPUTE_REASONS[dispute.reason] ?? dispute.reason}
      </Typography>

      {notice && (
        <Alert severity={notice.severity} onClose={() => setNotice(null)} sx={{ mt: 3 }}>
          {notice.text}
        </Alert>
      )}

      {dispute.status === 'resolved' && dispute.outcome && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography sx={{ fontWeight: 600 }}>Decision: {DISPUTE_OUTCOMES[dispute.outcome].label}</Typography>
          <Typography variant="body2">{DISPUTE_OUTCOMES[dispute.outcome].explanation}</Typography>
          {dispute.resolution && (
            <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
              {dispute.resolution}
            </Typography>
          )}
        </Alert>
      )}
      {isOpen && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          While this dispute is open the milestone is frozen and its money stays in escrow. A Kirmya administrator
          will review the evidence and decide.
        </Alert>
      )}

      <Paper variant="outlined" sx={{ mt: 3, p: { xs: 2, sm: 3 } }}>
        <Typography variant="overline" color="text.secondary">
          What happened
        </Typography>
        <Typography sx={{ whiteSpace: 'pre-wrap' }}>{dispute.detail}</Typography>
        {dispute.milestone && (
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Milestone: <strong>{dispute.milestone.title}</strong> ·{' '}
              {formatMoney(dispute.milestone.amount, dispute.milestone.currency)}
            </Typography>
            <Chip
              size="small"
              label={MILESTONE_STATUS[dispute.milestone.status]?.label ?? dispute.milestone.status}
              color={MILESTONE_STATUS[dispute.milestone.status]?.color ?? 'default'}
            />
          </Stack>
        )}
        {isOpen && isRaiser && (
          <Button
            sx={{ mt: 2 }}
            variant="outlined"
            onClick={() => withdraw.mutate()}
            disabled={withdraw.isPending}
          >
            Withdraw dispute
          </Button>
        )}
      </Paper>

      <Typography variant="h6" component="h2" sx={{ mt: 4, mb: 1 }}>
        Evidence
      </Typography>
      {dispute.evidence.length === 0 ? (
        <Typography color="text.secondary">No evidence has been added yet.</Typography>
      ) : (
        <Stack spacing={1.5}>
          {dispute.evidence.map(e => (
            <EvidenceItem key={e.id} evidence={e} who={who(e.uploaded_by)} />
          ))}
        </Stack>
      )}

      {isOpen && (
        <AddEvidenceForm
          disputeID={disputeID}
          onAdded={() => {
            setNotice({ severity: 'success', text: 'Evidence added. Both parties and the reviewer can see it.' });
            refresh();
          }}
        />
      )}
    </Box>
  );
}

function EvidenceItem({ evidence: e, who }: { evidence: DisputeEvidence; who: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="caption" color="text.secondary">
        {who} · {formatDate(e.created_at)}
      </Typography>
      {e.body && <Typography sx={{ whiteSpace: 'pre-wrap' }}>{e.body}</Typography>}
      {e.file_url && (
        <MuiLink href={e.file_url} target="_blank" rel="noopener noreferrer nofollow" sx={{ wordBreak: 'break-all' }}>
          {e.file_url}
        </MuiLink>
      )}
    </Paper>
  );
}

function AddEvidenceForm({ disputeID, onAdded }: { disputeID: string; onAdded: () => void }) {
  const [kind, setKind] = React.useState<EvidenceKind>('note');
  const [body, setBody] = React.useState('');
  const [fileURL, setFileURL] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const add = useMutation({
    mutationFn: () =>
      freelanceApi.addEvidence(disputeID, {
        kind,
        body: body.trim() || undefined,
        file_url: kind === 'note' ? undefined : fileURL.trim(),
      }),
    onSuccess: () => {
      setBody('');
      setFileURL('');
      setError(null);
      onAdded();
    },
    onError: (err: unknown) => setError(freelanceErrorMessage(err, 'The evidence could not be added.')),
  });

  const linkInvalid = kind !== 'note' && fileURL.trim() !== '' && !/^https?:\/\//i.test(fileURL.trim());
  const valid = kind === 'note' ? body.trim() !== '' : fileURL.trim() !== '' && !linkInvalid;

  return (
    <Paper variant="outlined" sx={{ mt: 3, p: { xs: 2, sm: 3 } }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
        Add evidence
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Stack spacing={2}>
        <TextField select label="Type" value={kind} onChange={e => setKind(e.target.value as EvidenceKind)} sx={{ maxWidth: 240 }}>
          <MenuItem value="note">Note</MenuItem>
          <MenuItem value="link">Link</MenuItem>
          <MenuItem value="file">File (link to it)</MenuItem>
        </TextField>
        {kind !== 'note' && (
          <TextField
            label="Link"
            value={fileURL}
            onChange={e => setFileURL(e.target.value)}
            error={linkInvalid}
            helperText={linkInvalid ? 'Must start with http:// or https://' : ' '}
            fullWidth
          />
        )}
        <TextField
          label={kind === 'note' ? 'Your note' : 'What this shows (optional)'}
          value={body}
          onChange={e => setBody(e.target.value)}
          multiline
          minRows={3}
          fullWidth
        />
        <Box>
          <Button variant="contained" disabled={!valid || add.isPending} onClick={() => add.mutate()}>
            Add evidence
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}

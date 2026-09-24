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
  Divider,
  Link as MuiLink,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { freelanceApi } from '../../features/freelance/api';
import { freelanceErrorMessage } from '../../features/freelance/errors';
import {
  OPEN_DISPUTE_STATUSES,
  type ContractDetail,
  type ContractMilestone,
} from '../../features/freelance/types';
import { useAuth } from '../../hooks/useAuth';
import { routes } from '../../shared/routes';
import {
  AddMilestoneDialog,
  OpenDisputeDialog,
  ReasonDialog,
  SubmitWorkDialog,
} from './MilestoneDialogs';
import { CONTRACT_STATUS, MILESTONE_STATUS, formatDate, formatMoney } from './escrowFormat';

/*
 * One contract, as either party sees it.
 *
 * What each person may do is decided by the server; this screen only offers an
 * action to the party the server will accept it from, so nobody is shown a
 * button that exists only to fail. The client schedules, funds, reviews and
 * releases. The freelancer delivers, and may give money back. Either may
 * dispute a milestone whose money is in escrow.
 */

type Role = 'client' | 'freelancer';

type DialogState =
  | { kind: 'add' }
  | { kind: 'submit' | 'revision' | 'refund' | 'dispute'; milestone: ContractMilestone }
  | null;

const HOLDS_ESCROW = new Set(['funded', 'in_progress', 'submitted']);

export default function ContractView({ contractID }: { contractID: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = React.useState<DialogState>(null);
  const [dialogError, setDialogError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<{ severity: 'success' | 'info' | 'error'; text: string } | null>(null);

  const contractKey = ['freelance', 'contract', contractID];
  const {
    data: contract,
    isLoading,
    error: loadError,
  } = useQuery<ContractDetail>({
    queryKey: contractKey,
    queryFn: () => freelanceApi.getContract(contractID),
    retry: false,
  });
  const { data: disputes } = useQuery({
    queryKey: ['freelance', 'contract', contractID, 'disputes'],
    queryFn: () => freelanceApi.listContractDisputes(contractID),
    enabled: Boolean(contract),
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['freelance', 'contract', contractID] });
    queryClient.invalidateQueries({ queryKey: ['freelance', 'contracts'] });
  };
  const close = () => {
    setDialog(null);
    setDialogError(null);
  };
  // A dialog's failure is shown in the dialog; a row action's in the banner.
  const mutationOptions = (success: string, inDialog: boolean) => ({
    onSuccess: () => {
      close();
      setNotice({ severity: 'success', text: success });
      refresh();
    },
    onError: (err: unknown) => {
      const message = freelanceErrorMessage(err, 'That did not work. Please try again.');
      if (inDialog) setDialogError(message);
      else setNotice({ severity: 'error', text: message });
      refresh();
    },
  });

  const addMilestone = useMutation({
    mutationFn: (payload: Parameters<typeof freelanceApi.addMilestone>[1]) =>
      freelanceApi.addMilestone(contractID, payload),
    ...mutationOptions('Milestone added. Fund it when you are ready for the work to start.', true),
  });
  const submitWork = useMutation({
    mutationFn: (args: { id: string; payload: Parameters<typeof freelanceApi.submitMilestone>[2] }) =>
      freelanceApi.submitMilestone(contractID, args.id, args.payload),
    ...mutationOptions('Work submitted. The client has been asked to review it.', true),
  });
  const requestRevision = useMutation({
    mutationFn: (args: { id: string; reason: string }) =>
      freelanceApi.requestRevision(contractID, args.id, args.reason),
    ...mutationOptions('Changes requested. The money stays in escrow until you approve.', true),
  });
  const refund = useMutation({
    mutationFn: (args: { id: string; reason: string }) => freelanceApi.refundMilestone(contractID, args.id, args.reason),
    ...mutationOptions('Refunded. The money has been returned to the client.', true),
  });
  const openDispute = useMutation({
    mutationFn: (args: { id: string; payload: Parameters<typeof freelanceApi.openDispute>[2] }) =>
      freelanceApi.openDispute(contractID, args.id, args.payload),
    ...mutationOptions('Dispute opened. The milestone is frozen until it is settled.', true),
  });
  const approve = useMutation({
    mutationFn: (id: string) => freelanceApi.approveMilestone(contractID, id),
    ...mutationOptions('Approved. The escrowed money has been released to the freelancer.', false),
  });
  const cancel = useMutation({
    mutationFn: (id: string) => freelanceApi.cancelMilestone(contractID, id),
    ...mutationOptions('Milestone cancelled.', false),
  });
  const fund = useMutation({
    mutationFn: (id: string) => freelanceApi.fundMilestone(contractID, id),
    onSuccess: result => {
      refresh();
      // The processor collects the money on its own page when it has one.
      if (result.checkout_url) {
        window.location.assign(result.checkout_url);
        return;
      }
      setNotice({
        severity: 'info',
        text: 'Payment requested. The milestone will show as funded once the payment is confirmed.',
      });
    },
    onError: (err: unknown) => {
      setNotice({ severity: 'error', text: freelanceErrorMessage(err, 'The payment could not be started.') });
      refresh();
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress aria-label="Loading contract" />
      </Box>
    );
  }
  if (loadError || !contract) {
    return (
      <Alert severity="error" sx={{ my: 4 }}>
        {freelanceErrorMessage(loadError, 'This contract could not be loaded.')}
      </Alert>
    );
  }

  const role: Role | null =
    user?.id === contract.client_id ? 'client' : user?.id === contract.freelancer_id ? 'freelancer' : null;
  const live = contract.status !== 'completed' && contract.status !== 'cancelled';
  const openDisputeRecord = disputes?.data.find(d => OPEN_DISPUTE_STATUSES.includes(d.status));
  const { escrow, currency } = { escrow: contract.escrow, currency: contract.currency };
  const anyPending = addMilestone.isPending || submitWork.isPending || requestRevision.isPending ||
    refund.isPending || openDispute.isPending || approve.isPending || cancel.isPending || fund.isPending;

  return (
    <Box sx={{ py: 4 }}>
      <MuiLink component={Link} href={routes.freelance.home()} underline="hover" sx={{ display: 'inline-flex', gap: 0.5, mb: 2 }}>
        <ArrowBackIcon fontSize="small" /> Freelance
      </MuiLink>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            {contract.project_title || 'Contract'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {role === 'client' ? 'You hired for this contract.' : role === 'freelancer' ? 'You were hired for this contract.' : ''}
          </Typography>
        </Box>
        <Chip label={CONTRACT_STATUS[contract.status]?.label ?? contract.status} color={CONTRACT_STATUS[contract.status]?.color ?? 'default'} />
      </Stack>

      {notice && (
        <Alert severity={notice.severity} onClose={() => setNotice(null)} sx={{ mt: 3 }}>
          {notice.text}
        </Alert>
      )}
      {openDisputeRecord && (
        <Alert severity="warning" sx={{ mt: 3 }}
          action={<Button component={Link} href={routes.freelance.dispute(openDisputeRecord.id)} color="inherit" size="small">View dispute</Button>}>
          A milestone on this contract is in dispute. Its money stays in escrow until the dispute is settled.
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2,
          mt: 3,
        }}
      >
        <Stat label="Contract value" value={formatMoney(escrow.contract_total, currency)} />
        <Stat label="In escrow" value={formatMoney(escrow.in_escrow, currency)} />
        <Stat label="Paid to freelancer" value={formatMoney(escrow.released, currency)} />
        <Stat label="Not yet scheduled" value={formatMoney(escrow.unallocated, currency)} />
      </Box>

      <Paper variant="outlined" sx={{ mt: 3, p: { xs: 2, sm: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" component="h2">
            Milestones
          </Typography>
          {role === 'client' && live && escrow.unallocated > 0 && (
            <Button startIcon={<AddIcon />} variant="contained" onClick={() => setDialog({ kind: 'add' })}>
              Add milestone
            </Button>
          )}
        </Stack>

        {contract.milestones.length === 0 ? (
          <Typography color="text.secondary">
            {role === 'client'
              ? 'No milestones yet. Split the contract into steps, then fund the first one so the work can start.'
              : 'No milestones yet. The client schedules the work in milestones and funds each before it starts.'}
          </Typography>
        ) : (
          <Stack divider={<Divider flexItem />} spacing={2}>
            {contract.milestones.map(m => (
              <MilestoneRow
                key={m.id}
                milestone={m}
                role={role}
                disabled={anyPending}
                disputeHref={openDisputeRecord?.milestone_id === m.id ? routes.freelance.dispute(openDisputeRecord.id) : undefined}
                canDispute={!openDisputeRecord}
                onFund={() => fund.mutate(m.id)}
                onCancel={() => cancel.mutate(m.id)}
                onApprove={() => approve.mutate(m.id)}
                onOpen={kind => setDialog({ kind, milestone: m })}
              />
            ))}
          </Stack>
        )}
      </Paper>

      <AddMilestoneDialog
        open={dialog?.kind === 'add'}
        pending={addMilestone.isPending}
        error={dialogError}
        onClose={close}
        currency={currency}
        maxAmount={escrow.unallocated}
        onSubmit={payload => addMilestone.mutate(payload)}
      />
      {dialog && dialog.kind !== 'add' && (
        <>
          <SubmitWorkDialog
            open={dialog.kind === 'submit'}
            pending={submitWork.isPending}
            error={dialogError}
            onClose={close}
            milestoneTitle={dialog.milestone.title}
            onSubmit={payload => submitWork.mutate({ id: dialog.milestone.id, payload })}
          />
          <ReasonDialog
            open={dialog.kind === 'revision'}
            pending={requestRevision.isPending}
            error={dialogError}
            onClose={close}
            title={`Request changes: ${dialog.milestone.title}`}
            explanation="The work goes back to the freelancer with your note. The money stays in escrow until you approve."
            label="What needs to change"
            confirmLabel="Request changes"
            onSubmit={reason => requestRevision.mutate({ id: dialog.milestone.id, reason })}
          />
          <ReasonDialog
            open={dialog.kind === 'refund'}
            pending={refund.isPending}
            error={dialogError}
            onClose={close}
            title={`Refund the client: ${dialog.milestone.title}`}
            explanation={`${formatMoney(dialog.milestone.amount, dialog.milestone.currency)} will be returned to the client and the milestone cancelled. This cannot be undone.`}
            label="Why you are refunding"
            confirmLabel="Refund"
            destructive
            onSubmit={reason => refund.mutate({ id: dialog.milestone.id, reason })}
          />
          <OpenDisputeDialog
            open={dialog.kind === 'dispute'}
            pending={openDispute.isPending}
            error={dialogError}
            onClose={close}
            milestoneTitle={dialog.milestone.title}
            onSubmit={payload => openDispute.mutate({ id: dialog.milestone.id, payload })}
          />
        </>
      )}
    </Box>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="caption" color="text.secondary" component="p">
        {label}
      </Typography>
      <Typography variant="h6" component="p" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
    </Paper>
  );
}

function MilestoneRow({
  milestone: m,
  role,
  disabled,
  disputeHref,
  canDispute,
  onFund,
  onCancel,
  onApprove,
  onOpen,
}: {
  milestone: ContractMilestone;
  role: Role | null;
  disabled: boolean;
  disputeHref?: string;
  canDispute: boolean;
  onFund: () => void;
  onCancel: () => void;
  onApprove: () => void;
  onOpen: (kind: 'submit' | 'revision' | 'refund' | 'dispute') => void;
}) {
  const status = MILESTONE_STATUS[m.status] ?? { label: m.status, color: 'default' as const };
  const escrowed = HOLDS_ESCROW.has(m.status);

  const actions: React.ReactNode[] = [];
  if (role === 'client') {
    if (m.status === 'pending') {
      actions.push(
        <Button key="fund" variant="contained" size="small" onClick={onFund} disabled={disabled}>
          Fund {formatMoney(m.amount, m.currency)}
        </Button>,
        <Button key="cancel" size="small" onClick={onCancel} disabled={disabled}>
          Cancel
        </Button>
      );
    }
    if (m.status === 'submitted') {
      actions.push(
        <Button key="approve" variant="contained" color="success" size="small" onClick={onApprove} disabled={disabled}>
          Approve and release
        </Button>,
        <Button key="revision" size="small" onClick={() => onOpen('revision')} disabled={disabled}>
          Request changes
        </Button>
      );
    }
  }
  if (role === 'freelancer') {
    if (m.status === 'funded' || m.status === 'in_progress') {
      actions.push(
        <Button key="submit" variant="contained" size="small" onClick={() => onOpen('submit')} disabled={disabled}>
          Submit work
        </Button>
      );
    }
    if (escrowed) {
      actions.push(
        <Button key="refund" size="small" onClick={() => onOpen('refund')} disabled={disabled}>
          Refund client
        </Button>
      );
    }
  }
  if (role && escrowed && canDispute) {
    actions.push(
      <Button key="dispute" size="small" color="error" onClick={() => onOpen('dispute')} disabled={disabled}>
        Open dispute
      </Button>
    );
  }
  if (disputeHref) {
    actions.push(
      <Button key="view-dispute" size="small" component={Link} href={disputeHref}>
        View dispute
      </Button>
    );
  }

  return (
    <Box data-testid={`milestone-${m.id}`}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
        <Box>
          <Typography sx={{ fontWeight: 600 }}>{m.title}</Typography>
          {m.description && (
            <Typography variant="body2" color="text.secondary">
              {m.description}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            {m.due_at ? `Due ${formatDate(m.due_at)}` : 'No due date'}
            {m.completed_at ? ` · Paid ${formatDate(m.completed_at)}` : ''}
          </Typography>
        </Box>
        <Stack alignItems={{ sm: 'flex-end' }} spacing={0.5}>
          <Typography sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {formatMoney(m.amount, m.currency)}
          </Typography>
          <Chip size="small" label={status.label} color={status.color} />
        </Stack>
      </Stack>
      {m.status === 'pending' && role === 'freelancer' && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Waiting for the client to fund this milestone. Do not start work on it until it shows as funded.
        </Typography>
      )}
      {actions.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
          {actions}
        </Stack>
      )}
    </Box>
  );
}

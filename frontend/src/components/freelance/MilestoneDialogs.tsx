'use client';

import React from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';

import type {
  CreateMilestonePayload,
  DisputeReason,
  OpenDisputePayload,
  SubmitMilestonePayload,
} from '../../features/freelance/types';
import { DISPUTE_REASONS, formatMoney } from './escrowFormat';

/*
 * The forms behind the contract screen's actions.
 *
 * Each dialog keeps its form state in an inner body component. MUI unmounts a
 * closed dialog's content, so every open starts from an empty form - without
 * resetting state from an effect. Each validates what the
 * server would refuse anyway - a clear message before the request is better
 * than the same refusal after it - and none decides who may act: the screen
 * only offers an action to the party the server will accept it from.
 */

interface BaseProps {
  open: boolean;
  pending: boolean;
  error?: string | null;
  onClose: () => void;
}

type AddMilestoneProps = BaseProps & {
  onSubmit: (payload: CreateMilestonePayload) => void;
  currency: string;
  maxAmount: number;
};

export function AddMilestoneDialog(props: AddMilestoneProps) {
  return (
    <Dialog open={props.open} onClose={props.onClose} maxWidth="sm" fullWidth>
      <AddMilestoneBody {...props} />
    </Dialog>
  );
}

function AddMilestoneBody({ pending, error, onClose, onSubmit, currency, maxAmount }: AddMilestoneProps) {
  const [title, setTitle] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [dueAt, setDueAt] = React.useState('');

  const value = Number(amount);
  const amountError =
    amount === ''
      ? ''
      : !(value > 0)
        ? 'Enter an amount greater than zero.'
        : value > maxAmount
          ? `Only ${formatMoney(maxAmount, currency)} of the contract is left to schedule.`
          : '';
  const valid = title.trim() !== '' && amount !== '' && !amountError;

  return (
    <>
      <DialogTitle>Add a milestone</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <DialogContentText>
            A milestone is one step of the work and its payment. You fund it before the freelancer starts, and the
            money is released when you approve the work.
          </DialogContentText>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Title" value={title} onChange={e => setTitle(e.target.value)} required fullWidth />
          <TextField
            label={`Amount (${currency})`}
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            fullWidth
            error={Boolean(amountError)}
            helperText={amountError || `Up to ${formatMoney(maxAmount, currency)}`}
            inputProps={{ min: 0, step: '0.01' }}
          />
          <TextField
            label="What will be delivered"
            value={description}
            onChange={e => setDescription(e.target.value)}
            multiline
            minRows={2}
            fullWidth
          />
          <TextField
            label="Due date"
            type="date"
            value={dueAt}
            onChange={e => setDueAt(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!valid || pending}
          onClick={() =>
            onSubmit({
              title: title.trim(),
              amount: value,
              description: description.trim() || undefined,
              due_at: dueAt ? new Date(`${dueAt}T23:59:59`).toISOString() : undefined,
            })
          }
        >
          Add milestone
        </Button>
      </DialogActions>
    </>
  );
}

type SubmitWorkProps = BaseProps & { onSubmit: (payload: SubmitMilestonePayload) => void; milestoneTitle: string };

export function SubmitWorkDialog(props: SubmitWorkProps) {
  return (
    <Dialog open={props.open} onClose={props.onClose} maxWidth="sm" fullWidth>
      <SubmitWorkBody {...props} />
    </Dialog>
  );
}

function SubmitWorkBody({ pending, error, onClose, onSubmit, milestoneTitle }: SubmitWorkProps) {
  const [summary, setSummary] = React.useState('');
  const [links, setLinks] = React.useState('');

  const attachments = links
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
  const badLink = attachments.find(link => !/^https?:\/\//i.test(link));

  return (
    <>
      <DialogTitle>Submit work: {milestoneTitle}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="What you delivered"
            value={summary}
            onChange={e => setSummary(e.target.value)}
            multiline
            minRows={3}
            required
            fullWidth
          />
          <TextField
            label="Links to the work (one per line)"
            value={links}
            onChange={e => setLinks(e.target.value)}
            multiline
            minRows={2}
            fullWidth
            error={Boolean(badLink)}
            helperText={badLink ? 'Each link must start with http:// or https://' : 'A repository, a demo, a shared folder'}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={summary.trim() === '' || Boolean(badLink) || pending}
          onClick={() => onSubmit({ summary: summary.trim(), attachments })}
        >
          Submit for review
        </Button>
      </DialogActions>
    </>
  );
}

/** A confirmation that needs a written reason: requesting changes, refunding. */
type ReasonProps = BaseProps & {
  onSubmit: (reason: string) => void;
  title: string;
  explanation: string;
  label: string;
  confirmLabel: string;
  destructive?: boolean;
};

export function ReasonDialog(props: ReasonProps) {
  return (
    <Dialog open={props.open} onClose={props.onClose} maxWidth="sm" fullWidth>
      <ReasonBody {...props} />
    </Dialog>
  );
}

function ReasonBody({ pending, error, onClose, onSubmit, title, explanation, label, confirmLabel, destructive }: ReasonProps) {
  const [reason, setReason] = React.useState('');

  return (
    <>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <DialogContentText>{explanation}</DialogContentText>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label={label}
            value={reason}
            onChange={e => setReason(e.target.value)}
            multiline
            minRows={3}
            required
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={destructive ? 'error' : 'primary'}
          disabled={reason.trim() === '' || pending}
          onClick={() => onSubmit(reason.trim())}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </>
  );
}

type OpenDisputeProps = BaseProps & { onSubmit: (payload: OpenDisputePayload) => void; milestoneTitle: string };

export function OpenDisputeDialog(props: OpenDisputeProps) {
  return (
    <Dialog open={props.open} onClose={props.onClose} maxWidth="sm" fullWidth>
      <OpenDisputeBody {...props} />
    </Dialog>
  );
}

function OpenDisputeBody({ pending, error, onClose, onSubmit, milestoneTitle }: OpenDisputeProps) {
  const [reason, setReason] = React.useState<DisputeReason | ''>('');
  const [detail, setDetail] = React.useState('');

  return (
    <>
      <DialogTitle>Open a dispute: {milestoneTitle}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <DialogContentText>
            The milestone is frozen while the dispute is open: its money stays in escrow and nobody can submit,
            approve or refund it. Both of you can add evidence, and a Kirmya administrator decides. You can withdraw
            the dispute if you settle it yourselves.
          </DialogContentText>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            select
            label="Reason"
            value={reason}
            onChange={e => setReason(e.target.value as DisputeReason)}
            required
            fullWidth
          >
            {(Object.keys(DISPUTE_REASONS) as DisputeReason[]).map(key => (
              <MenuItem key={key} value={key}>
                {DISPUTE_REASONS[key]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="What happened"
            value={detail}
            onChange={e => setDetail(e.target.value)}
            multiline
            minRows={4}
            required
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="error"
          disabled={reason === '' || detail.trim() === '' || pending}
          onClick={() => reason && onSubmit({ reason, detail: detail.trim() })}
        >
          Open dispute
        </Button>
      </DialogActions>
    </>
  );
}

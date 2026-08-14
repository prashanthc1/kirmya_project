'use client';

import React from 'react';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { CompanyPerson } from '../../features/company/types';
import { useTeam, useTransferOwnership } from '../../features/company/hooks';

export interface TransferOwnershipDialogProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  members?: CompanyPerson[];
  onSuccess?: () => void;
}

export const TransferOwnershipDialog: React.FC<TransferOwnershipDialogProps> = ({
  open,
  onClose,
  companyId,
  members: passedMembers,
  onSuccess,
}) => {
  const { data: teamData, isLoading: isLoadingTeam } = useTeam(
    companyId,
    {},
    { enabled: open && !passedMembers }
  );

  const transferMutation = useTransferOwnership(companyId);

  const teamMembers = passedMembers || teamData?.items || [];

  const [selectedMemberId, setSelectedMemberId] = React.useState<string>('');
  const [reason, setReason] = React.useState<string>('');
  const [confirmName, setConfirmName] = React.useState<string>('');

  const selectedMember = teamMembers.find((m) => m.id === selectedMemberId || m.userId === selectedMemberId);

  const handleClose = () => {
    setSelectedMemberId('');
    setReason('');
    setConfirmName('');
    onClose();
  };

  const handleTransfer = () => {
    if (!selectedMemberId) return;

    transferMutation.mutate(
      {
        newOwnerId: selectedMemberId,
        reason: reason || undefined,
      },
      {
        onSuccess: () => {
          handleClose();
          if (onSuccess) onSuccess();
        },
      }
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningAmberIcon color="warning" />
        Transfer Organization Ownership
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Alert severity="warning" sx={{ borderRadius: '12px' }}>
            <AlertTitle>Irreversible Action</AlertTitle>
            Transferring ownership gives the designated team member full primary owner permissions over this organization. You will become a standard Organization Admin.
          </Alert>

          {transferMutation.isError && (
            <Alert severity="error" sx={{ borderRadius: '12px' }}>
              {(transferMutation.error as Error)?.message || 'Failed to transfer ownership.'}
            </Alert>
          )}

          <FormControl fullWidth size="small" required>
            <InputLabel id="select-new-owner-label">Select New Owner</InputLabel>
            <Select
              labelId="select-new-owner-label"
              value={selectedMemberId}
              label="Select New Owner"
              onChange={(e) => setSelectedMemberId(e.target.value)}
              disabled={isLoadingTeam || transferMutation.isPending}
            >
              {isLoadingTeam ? (
                <MenuItem disabled value="">
                  Loading team members...
                </MenuItem>
              ) : teamMembers.length === 0 ? (
                <MenuItem disabled value="">
                  No eligible team members found
                </MenuItem>
              ) : (
                teamMembers.map((member) => (
                  <MenuItem key={member.id} value={member.userId || member.id}>
                    {member.name} ({member.jobTitle || member.role})
                  </MenuItem>
                ))
              )}
            </Select>
            <FormHelperText>Must be an active team member of this organization.</FormHelperText>
          </FormControl>

          <TextField
            label="Reason for Ownership Transfer"
            multiline
            rows={3}
            fullWidth
            size="small"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional note explaining the transfer of administrative ownership"
            disabled={transferMutation.isPending}
          />

          {selectedMember && (
            <Box sx={{ p: 2, borderRadius: '12px', bgcolor: 'action.hover' }}>
              <Typography variant="body2" color="text.secondary">
                You are about to hand over owner rights to <strong>{selectedMember.name}</strong>.
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} disabled={transferMutation.isPending}>
          Cancel
        </Button>
        <Button
          onClick={handleTransfer}
          variant="contained"
          color="error"
          disabled={!selectedMemberId || transferMutation.isPending}
          startIcon={transferMutation.isPending ? <CircularProgress size={18} color="inherit" /> : null}
          sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
        >
          {transferMutation.isPending ? 'Transferring...' : 'Confirm Ownership Transfer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransferOwnershipDialog;

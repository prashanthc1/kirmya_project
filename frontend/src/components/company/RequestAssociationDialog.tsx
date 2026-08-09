'use client';

/**
 * "I work here" — a request, never a fact.
 *
 * Submitting this creates a pending membership that someone holding
 * `people:approve` at the company has to accept. The visibility switch is the
 * person's own call: it decides whether the association appears on the public
 * people directory once approved.
 */
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from '@mui/material';

import { useRequestAssociation } from '../../features/company/hooks';
import { AssociationForm, associationSchema } from '../../features/company/schemas';
import { ASSOCIATION_LABELS, AssociationType, CompanyDepartment } from '../../features/company/types';

interface RequestAssociationDialogProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  companyName: string;
  departments: CompanyDepartment[];
}

/** Roles that carry authority are granted by invitation, not claimed. */
const CLAIMABLE_ASSOCIATIONS: AssociationType[] = [
  'current_employee',
  'former_employee',
  'contractor',
  'intern',
];

export const RequestAssociationDialog: React.FC<RequestAssociationDialogProps> = ({
  open,
  onClose,
  companyId,
  companyName,
  departments,
}) => {
  const request = useRequestAssociation(companyId);
  const [submitted, setSubmitted] = React.useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssociationForm>({
    resolver: zodResolver(associationSchema),
    defaultValues: {
      associationType: 'current_employee',
      jobTitle: '',
      departmentId: '',
      location: '',
      isPublic: true,
    },
  });

  const handleClose = () => {
    if (isSubmitting || request.isPending) return;
    onClose();
    // Let the dialog finish closing before the content changes underneath it.
    setTimeout(() => {
      setSubmitted(false);
      request.reset();
      reset();
    }, 200);
  };

  const onSubmit = handleSubmit(async (values) => {
    await request.mutateAsync({
      associationType: values.associationType,
      jobTitle: values.jobTitle,
      departmentId: values.departmentId || null,
      location: values.location || '',
      isPublic: values.isPublic,
    });
    setSubmitted(true);
  });

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Confirm your role at {companyName}</DialogTitle>

      {submitted ? (
        <>
          <DialogContent>
            <Alert severity="success">
              Your request was sent. {companyName} has to approve it before the association appears
              on your profile or their people directory.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} variant="contained">
              Done
            </Button>
          </DialogActions>
        </>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <DialogContent>
            <DialogContentText sx={{ mb: 2.5 }}>
              An administrator at {companyName} reviews every request. Nothing is published until
              they approve it.
            </DialogContentText>

            <Stack spacing={2.5}>
              <Controller
                name="associationType"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="How are you associated?"
                    error={!!errors.associationType}
                    helperText={errors.associationType?.message}
                    fullWidth
                  >
                    {CLAIMABLE_ASSOCIATIONS.map((type) => (
                      <MenuItem key={type} value={type}>
                        {ASSOCIATION_LABELS[type]}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <Controller
                name="jobTitle"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Job title"
                    error={!!errors.jobTitle}
                    helperText={errors.jobTitle?.message}
                    fullWidth
                  />
                )}
              />

              {departments.length > 0 && (
                <Controller
                  name="departmentId"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Department (optional)" fullWidth>
                      <MenuItem value="">Not specified</MenuItem>
                      {departments.map((department) => (
                        <MenuItem key={department.id} value={department.id}>
                          {department.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              )}

              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Location (optional)"
                    error={!!errors.location}
                    helperText={errors.location?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="isPublic"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={field.onChange} />}
                    label="Show this association publicly on the company's people page"
                  />
                )}
              />

              {request.isError && (
                <Alert severity="error">
                  {request.error?.message || 'That request could not be sent.'}
                </Alert>
              )}
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleClose} disabled={request.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={request.isPending}>
              {request.isPending ? 'Sending…' : 'Send request'}
            </Button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  );
};

export default RequestAssociationDialog;

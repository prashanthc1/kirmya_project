'use client';

/**
 * Write or edit a company review.
 *
 * Reviews are written by people, not generated. Nothing in this form is
 * pre-filled with suggested wording, and the ratings start unset so a
 * submission always reflects a deliberate choice.
 */
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Rating,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';

import { useSubmitReview } from '../../features/company/hooks';
import { ReviewForm, reviewSchema } from '../../features/company/schemas';
import { CompanyReview, ReviewEmploymentType } from '../../features/company/types';

interface ReviewFormDialogProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  identifier: string;
  companyName: string;
  /** Present when editing the caller's existing review. */
  review?: CompanyReview | null;
}

const EMPLOYMENT_TYPES: Array<{ value: ReviewEmploymentType; label: string }> = [
  { value: 'current_employee', label: 'Current employee' },
  { value: 'former_employee', label: 'Former employee' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'intern', label: 'Intern' },
];

const CATEGORY_RATINGS: Array<{ name: keyof ReviewForm; label: string }> = [
  { name: 'workLifeBalance', label: 'Work-life balance' },
  { name: 'compensationRating', label: 'Compensation' },
  { name: 'cultureRating', label: 'Culture' },
  { name: 'managementRating', label: 'Management' },
  { name: 'careerGrowthRating', label: 'Career growth' },
];

const emptyForm: ReviewForm = {
  employmentType: 'current_employee',
  employmentStartedOn: '',
  employmentEndedOn: '',
  jobTitle: '',
  overallRating: 0 as unknown as number,
  workLifeBalance: 0,
  compensationRating: 0,
  cultureRating: 0,
  managementRating: 0,
  careerGrowthRating: 0,
  title: '',
  summary: '',
  pros: '',
  cons: '',
  isAnonymous: false,
};

const toForm = (review?: CompanyReview | null): ReviewForm =>
  review
    ? {
        employmentType: review.employmentType,
        employmentStartedOn: '',
        employmentEndedOn: '',
        jobTitle: review.jobTitle ?? '',
        overallRating: review.overallRating,
        workLifeBalance: review.workLifeBalance ?? 0,
        compensationRating: review.compensationRating ?? 0,
        cultureRating: review.cultureRating ?? 0,
        managementRating: review.managementRating ?? 0,
        careerGrowthRating: review.careerGrowthRating ?? 0,
        title: review.title,
        summary: review.summary,
        pros: review.pros ?? '',
        cons: review.cons ?? '',
        isAnonymous: review.isAnonymous,
      }
    : emptyForm;

export const ReviewFormDialog: React.FC<ReviewFormDialogProps> = ({
  open,
  onClose,
  companyId,
  identifier,
  companyName,
  review,
}) => {
  const submit = useSubmitReview(companyId, identifier);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: toForm(review),
  });

  React.useEffect(() => {
    if (open) reset(toForm(review));
  }, [open, review, reset]);

  const employmentType = watch('employmentType');
  const summary = watch('summary') ?? '';

  const handleClose = () => {
    if (submit.isPending) return;
    submit.reset();
    onClose();
  };

  const onSubmit = handleSubmit(async (values) => {
    const optional = (value?: number) => (value && value > 0 ? value : null);
    await submit.mutateAsync({
      reviewId: review?.id,
      payload: {
        employmentType: values.employmentType,
        employmentStartedOn: values.employmentStartedOn || null,
        employmentEndedOn: values.employmentEndedOn || null,
        jobTitle: values.jobTitle || '',
        overallRating: Number(values.overallRating),
        workLifeBalance: optional(Number(values.workLifeBalance)),
        compensationRating: optional(Number(values.compensationRating)),
        cultureRating: optional(Number(values.cultureRating)),
        managementRating: optional(Number(values.managementRating)),
        careerGrowthRating: optional(Number(values.careerGrowthRating)),
        title: values.title,
        summary: values.summary,
        pros: values.pros || '',
        cons: values.cons || '',
        isAnonymous: values.isAnonymous,
      },
    });
    onClose();
  });

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 700 }}>
        {review ? 'Edit your review' : `Review ${companyName}`}
      </DialogTitle>

      <form onSubmit={onSubmit} noValidate>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Write from your own experience. Reviews are moderated and can be reported by anyone who
            reads them.
          </DialogContentText>

          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="employmentType"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Your relationship"
                    error={!!errors.employmentType}
                    helperText={errors.employmentType?.message}
                    fullWidth
                  >
                    {EMPLOYMENT_TYPES.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
              <Controller
                name="jobTitle"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Job title (optional)" fullWidth />
                )}
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="employmentStartedOn"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="date"
                    label="Started"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                )}
              />
              <Controller
                name="employmentEndedOn"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    type="date"
                    label="Ended"
                    InputLabelProps={{ shrink: true }}
                    disabled={employmentType === 'current_employee'}
                    helperText={
                      employmentType === 'current_employee' ? 'You marked yourself as current' : ' '
                    }
                    fullWidth
                  />
                )}
              />
            </Stack>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                Overall rating
              </Typography>
              <Controller
                name="overallRating"
                control={control}
                render={({ field }) => (
                  <>
                    <Rating
                      value={Number(field.value) || null}
                      onChange={(_, value) => field.onChange(value ?? 0)}
                      size="large"
                    />
                    {errors.overallRating && (
                      <Typography variant="caption" color="error" display="block">
                        {errors.overallRating.message}
                      </Typography>
                    )}
                  </>
                )}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Category ratings (optional)
              </Typography>
              <Stack spacing={1}>
                {CATEGORY_RATINGS.map((category) => (
                  <Stack
                    key={category.name}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {category.label}
                    </Typography>
                    <Controller
                      name={category.name}
                      control={control}
                      render={({ field }) => (
                        <Rating
                          value={Number(field.value) || null}
                          onChange={(_, value) => field.onChange(value ?? 0)}
                        />
                      )}
                    />
                  </Stack>
                ))}
              </Stack>
            </Box>

            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Headline"
                  error={!!errors.title}
                  helperText={errors.title?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              name="summary"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Your review"
                  multiline
                  minRows={4}
                  error={!!errors.summary}
                  helperText={errors.summary?.message ?? `${summary.trim().length} characters`}
                  fullWidth
                />
              )}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Controller
                name="pros"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Pros" multiline minRows={3} fullWidth />
                )}
              />
              <Controller
                name="cons"
                control={control}
                render={({ field }) => (
                  <TextField {...field} label="Cons" multiline minRows={3} fullWidth />
                )}
              />
            </Stack>

            <Controller
              name="isAnonymous"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={field.onChange} />}
                  label="Post anonymously — your name and photo stay hidden from readers"
                />
              )}
            />

            {submit.isError && (
              <Alert severity="error">
                {submit.error?.message || 'That review could not be saved.'}
              </Alert>
            )}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} disabled={submit.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submit.isPending}>
            {submit.isPending ? 'Saving…' : review ? 'Save changes' : 'Publish review'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ReviewFormDialog;

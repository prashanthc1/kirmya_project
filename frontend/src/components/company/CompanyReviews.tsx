'use client';

/**
 * Employee reviews for a company.
 *
 * Every review shown here was written by a signed-in user and stored by the
 * server; the component never synthesises a review, a rating or a summary.
 * `canReview` comes from the server, which decides eligibility — the button
 * only reflects that answer.
 */
import React from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  MenuItem,
  Pagination,
  Rating,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ReplyIcon from '@mui/icons-material/Reply';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';

import {
  useCompanyReviews,
  useDeleteReview,
  useReportReview,
  useRespondToReview,
} from '../../features/company/hooks';
import { hasPermission } from '../../features/company/permissions';
import { CompanyReview, ViewerContext } from '../../features/company/types';
import ReviewFormDialog from './ReviewFormDialog';

interface CompanyReviewsProps {
  identifier: string;
  companyId: string;
  companyName: string;
  isAuthenticated: boolean;
  viewer?: ViewerContext;
  onRequireSignIn?: () => void;
  pageSize?: number;
}

const SORTS = [
  { value: 'recent', label: 'Most recent' },
  { value: 'rating_desc', label: 'Highest rated' },
  { value: 'rating_asc', label: 'Lowest rated' },
];

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or advertising' },
  { value: 'harassment', label: 'Harassment or hate' },
  { value: 'confidential', label: 'Discloses confidential information' },
  { value: 'personal_data', label: 'Identifies a specific person' },
  { value: 'false_information', label: 'Knowingly false' },
  { value: 'other', label: 'Something else' },
];

const EMPLOYMENT_LABELS: Record<string, string> = {
  current_employee: 'Current employee',
  former_employee: 'Former employee',
  contractor: 'Contractor',
  intern: 'Intern',
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

export const CompanyReviews: React.FC<CompanyReviewsProps> = ({
  identifier,
  companyId,
  companyName,
  isAuthenticated,
  viewer,
  onRequireSignIn,
  pageSize = 10,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState('recent');
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CompanyReview | null>(null);
  const [reporting, setReporting] = React.useState<CompanyReview | null>(null);
  const [reportReason, setReportReason] = React.useState('spam');
  const [reportDetails, setReportDetails] = React.useState('');
  const [respondingTo, setRespondingTo] = React.useState<CompanyReview | null>(null);
  const [responseText, setResponseText] = React.useState('');
  const [toast, setToast] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<CompanyReview | null>(null);

  const query = React.useMemo(() => ({ page, limit: pageSize, sort }), [page, pageSize, sort]);
  const { data, isLoading, isError, error } = useCompanyReviews(identifier, query, {
    placeholderData: (previous) => previous,
  });

  const report = useReportReview(companyId);
  const respond = useRespondToReview(companyId, identifier);
  const remove = useDeleteReview(companyId, identifier);

  const canRespond = hasPermission(viewer, 'review:respond');
  const reviews = data?.items ?? [];
  const total = data?.total ?? 0;

  const openWriteDialog = (review: CompanyReview | null) => {
    if (!isAuthenticated) {
      onRequireSignIn?.();
      return;
    }
    setEditing(review);
    setFormOpen(true);
  };

  const openReport = (review: CompanyReview) => {
    if (!isAuthenticated) {
      onRequireSignIn?.();
      return;
    }
    setReportReason('spam');
    setReportDetails('');
    setReporting(review);
  };

  const submitReport = async () => {
    if (!reporting) return;
    await report.mutateAsync({
      reviewId: reporting.id,
      reason: reportReason,
      details: reportDetails || undefined,
    });
    setReporting(null);
    setToast('Thanks — the moderation team will take a look.');
  };

  const submitResponse = async () => {
    if (!respondingTo) return;
    await respond.mutateAsync({ reviewId: respondingTo.id, response: responseText });
    setRespondingTo(null);
    setResponseText('');
    setToast('Your response has been published.');
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    await remove.mutateAsync(deleting.id);
    setDeleting(null);
    setToast('Your review was deleted.');
  };

  if (isLoading) {
    return (
      <Stack spacing={2}>
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} variant="rounded" height={160} sx={{ borderRadius: '16px' }} />
        ))}
      </Stack>
    );
  }

  if (isError) {
    return <Alert severity="error">{error?.message || 'Reviews could not be loaded.'}</Alert>;
  }

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        alignItems={{ xs: 'stretch', md: 'flex-start' }}
        sx={{ mb: 4 }}
      >
        <Box
          sx={{
            p: 3,
            borderRadius: '16px',
            minWidth: { md: 300 },
            border: '1px solid',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.12)',
            bgcolor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {total === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No reviews yet. Nothing here is estimated — the score appears once people write one.
            </Typography>
          ) : (
            <>
              <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1 }}>
                {(data?.averageRating ?? 0).toFixed(1)}
              </Typography>
              <Rating
                value={data?.averageRating ?? 0}
                precision={0.1}
                readOnly
                sx={{ mt: 1 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {total} {total === 1 ? 'review' : 'reviews'}
              </Typography>

              <Stack spacing={0.75} sx={{ mt: 2 }}>
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = data?.ratingBreakdown?.[String(star)] ?? 0;
                  const percent = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <Stack key={star} direction="row" spacing={1.5} alignItems="center">
                      <Typography variant="caption" sx={{ width: 12 }}>
                        {star}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={percent}
                        sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                        aria-label={`${star} star reviews`}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ width: 28 }}>
                        {count}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </>
          )}

          {data?.canReview && (
            <Button
              fullWidth
              variant="contained"
              startIcon={<RateReviewOutlinedIcon />}
              sx={{ mt: 2.5 }}
              onClick={() => openWriteDialog(null)}
            >
              Write a review
            </Button>
          )}
        </Box>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
            <TextField
              select
              size="small"
              label="Sort"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 180 }}
            >
              {SORTS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>

          {reviews.length === 0 ? (
            <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              Nobody has reviewed {companyName} yet.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {reviews.map((review) => (
                <Box
                  key={review.id}
                  component="article"
                  sx={{
                    p: 3,
                    borderRadius: '16px',
                    border: '1px solid',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.12)',
                    bgcolor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Avatar src={review.isAnonymous ? undefined : review.authorPhotoUrl} alt="">
                      {review.isAnonymous ? 'A' : review.authorName?.charAt(0) ?? '?'}
                    </Avatar>
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          {review.isAnonymous ? 'Anonymous' : review.authorName || 'Anonymous'}
                        </Typography>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={EMPLOYMENT_LABELS[review.employmentType] ?? review.employmentType}
                        />
                        {review.jobTitle && (
                          <Typography variant="caption" color="text.secondary">
                            {review.jobTitle}
                          </Typography>
                        )}
                        {review.employmentPeriod && (
                          <Typography variant="caption" color="text.secondary">
                            · {review.employmentPeriod}
                          </Typography>
                        )}
                      </Stack>

                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                        <Rating value={review.overallRating} readOnly size="small" />
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(review.createdAt)}
                        </Typography>
                      </Stack>

                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 1.5 }}>
                        {review.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5, whiteSpace: 'pre-line' }}
                      >
                        {review.summary}
                      </Typography>

                      {(review.pros || review.cons) && (
                        <Stack
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={2}
                          sx={{ mt: 2 }}
                        >
                          {review.pros && (
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700 }} color="success.main">
                                Pros
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {review.pros}
                              </Typography>
                            </Box>
                          )}
                          {review.cons && (
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700 }} color="error.main">
                                Cons
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {review.cons}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                      )}

                      {review.companyResponse && (
                        <Box
                          sx={{
                            mt: 2,
                            p: 2,
                            borderRadius: '12px',
                            bgcolor: isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.06)',
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            Response from {companyName}
                            {review.companyResponseAt
                              ? ` · ${formatDate(review.companyResponseAt)}`
                              : ''}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            {review.companyResponse}
                          </Typography>
                        </Box>
                      )}

                      <Divider sx={{ my: 1.5 }} />

                      <Stack direction="row" spacing={1} alignItems="center">
                        {review.isOwnReview && (
                          <>
                            <Button
                              size="small"
                              startIcon={<EditOutlinedIcon />}
                              onClick={() => openWriteDialog(review)}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<DeleteOutlineIcon />}
                              onClick={() => setDeleting(review)}
                            >
                              Delete
                            </Button>
                          </>
                        )}
                        {canRespond && !review.companyResponse && (
                          <Button
                            size="small"
                            startIcon={<ReplyIcon />}
                            onClick={() => {
                              setResponseText('');
                              setRespondingTo(review);
                            }}
                          >
                            Respond
                          </Button>
                        )}
                        {!review.isOwnReview && (
                          <Tooltip title="Report this review">
                            <IconButton
                              size="small"
                              aria-label="Report this review"
                              onClick={() => openReport(review)}
                            >
                              <FlagOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}

          {(data?.totalPages ?? 0) > 1 && (
            <Stack alignItems="center" sx={{ mt: 3 }}>
              <Pagination
                count={data?.totalPages ?? 1}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                shape="rounded"
              />
            </Stack>
          )}
        </Box>
      </Stack>

      <ReviewFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        companyId={companyId}
        identifier={identifier}
        companyName={companyName}
        review={editing}
      />

      <Dialog open={!!reporting} onClose={() => setReporting(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Report this review</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Reports go to Kirmya moderation. The review stays visible while it is assessed.
          </DialogContentText>
          <Stack spacing={2}>
            <TextField
              select
              label="Reason"
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
              fullWidth
            >
              {REPORT_REASONS.map((reason) => (
                <MenuItem key={reason.value} value={reason.value}>
                  {reason.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Details (optional)"
              value={reportDetails}
              onChange={(event) => setReportDetails(event.target.value)}
              multiline
              minRows={3}
              fullWidth
            />
            {report.isError && (
              <Alert severity="error">{report.error?.message || 'The report failed to send.'}</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setReporting(null)} disabled={report.isPending}>
            Cancel
          </Button>
          <Button variant="contained" onClick={submitReport} disabled={report.isPending}>
            Submit report
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!respondingTo} onClose={() => setRespondingTo(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Respond as {companyName}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Your response is public and attributed to the company, not to you personally.
          </DialogContentText>
          <TextField
            label="Response"
            value={responseText}
            onChange={(event) => setResponseText(event.target.value)}
            multiline
            minRows={4}
            fullWidth
            autoFocus
          />
          {respond.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {respond.error?.message || 'The response could not be published.'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRespondingTo(null)} disabled={respond.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={submitResponse}
            disabled={respond.isPending || responseText.trim().length === 0}
          >
            Publish response
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleting} onClose={() => setDeleting(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete your review?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This removes your review from {companyName} permanently.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleting(null)} disabled={remove.isPending}>
            Keep it
          </Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={remove.isPending}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setToast(null)} sx={{ borderRadius: '12px' }}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CompanyReviews;

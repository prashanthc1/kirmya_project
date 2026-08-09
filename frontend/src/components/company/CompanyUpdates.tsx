'use client';

/**
 * Company updates feed, plus the composer for members who may post.
 *
 * Public visitors receive published updates only — the server filters drafts
 * and scheduled posts out of the response, so the status filter below appears
 * only for members who can see them in the first place.
 */
import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Link as MuiLink,
  MenuItem,
  Pagination,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';

import {
  useCompanyUpdates,
  useDeleteUpdate,
  useSaveUpdate,
} from '../../features/company/hooks';
import { hasPermission } from '../../features/company/permissions';
import { UpdateForm, updateSchema } from '../../features/company/schemas';
import {
  CompanyUpdate,
  UPDATE_TYPE_LABELS,
  UpdateStatus,
  UpdateType,
  ViewerContext,
} from '../../features/company/types';

interface CompanyUpdatesProps {
  identifier: string;
  companyId: string;
  companyName: string;
  companyLogoUrl?: string;
  viewer?: ViewerContext;
  pageSize?: number;
}

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'draft', label: 'Drafts' },
  { value: 'archived', label: 'Archived' },
];

const STATUS_COLORS: Record<UpdateStatus, 'default' | 'success' | 'info' | 'warning'> = {
  draft: 'default',
  scheduled: 'info',
  published: 'success',
  archived: 'warning',
};

const formatDateTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
};

/** `datetime-local` needs `YYYY-MM-DDTHH:mm` in local time, not an ISO string. */
const toLocalInput = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const emptyForm: UpdateForm = {
  type: 'text',
  title: '',
  body: '',
  links: '',
  status: 'draft',
  scheduledAt: '',
};

export const CompanyUpdates: React.FC<CompanyUpdatesProps> = ({
  identifier,
  companyId,
  companyName,
  companyLogoUrl,
  viewer,
  pageSize = 10,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const canCreate = hasPermission(viewer, 'update:create');
  const canPublish = hasPermission(viewer, 'update:publish');
  const canDelete = hasPermission(viewer, 'update:delete');

  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState('');
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CompanyUpdate | null>(null);
  const [deleting, setDeleting] = React.useState<CompanyUpdate | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);

  const query = React.useMemo(
    () => ({ page, limit: pageSize, ...(status ? { status } : {}) }),
    [page, pageSize, status]
  );

  const { data, isLoading, isError, error } = useCompanyUpdates(identifier, query, {
    placeholderData: (previous) => previous,
  });
  const save = useSaveUpdate(companyId, identifier);
  const remove = useDeleteUpdate(companyId, identifier);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UpdateForm>({
    resolver: zodResolver(updateSchema),
    defaultValues: emptyForm,
  });

  const selectedStatus = watch('status');

  const openEditor = (update: CompanyUpdate | null) => {
    setEditing(update);
    reset(
      update
        ? {
            type: update.type,
            title: update.title ?? '',
            body: update.body,
            links: (update.links ?? []).join('\n'),
            status: update.status,
            scheduledAt: toLocalInput(update.scheduledAt),
          }
        : emptyForm
    );
    save.reset();
    setEditorOpen(true);
  };

  const closeEditor = () => {
    if (save.isPending) return;
    setEditorOpen(false);
  };

  const onSubmit = handleSubmit(async (values) => {
    await save.mutateAsync({
      updateId: editing?.id,
      payload: {
        type: values.type,
        title: values.title || '',
        body: values.body,
        links: (values.links || '')
          .split(/[\n,]/)
          .map((link) => link.trim())
          .filter(Boolean),
        status: values.status,
        scheduledAt:
          values.status === 'scheduled' && values.scheduledAt
            ? new Date(values.scheduledAt).toISOString()
            : null,
      },
    });
    setEditorOpen(false);
    setToast(editing ? 'Update saved.' : 'Update created.');
  });

  const confirmDelete = async () => {
    if (!deleting) return;
    await remove.mutateAsync(deleting.id);
    setDeleting(null);
    setToast('Update deleted.');
  };

  const updates = data?.items ?? [];

  const statusOptions: Array<{ value: UpdateStatus; label: string }> = [
    { value: 'draft', label: 'Save as draft' },
    ...(canPublish
      ? ([
          { value: 'scheduled', label: 'Schedule' },
          { value: 'published', label: 'Publish now' },
          { value: 'archived', label: 'Archive' },
        ] as Array<{ value: UpdateStatus; label: string }>)
      : []),
  ];

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        sx={{ mb: 3 }}
      >
        <Typography variant="body2" color="text.secondary">
          {data?.total ?? 0} {(data?.total ?? 0) === 1 ? 'update' : 'updates'}
        </Typography>

        <Stack direction="row" spacing={1.5}>
          {canCreate && (
            <TextField
              select
              size="small"
              label="Status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              sx={{ minWidth: 160 }}
            >
              {STATUS_FILTERS.map((option) => (
                <MenuItem key={option.value || 'all'} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          )}
          {canCreate && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => openEditor(null)}>
              New update
            </Button>
          )}
        </Stack>
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error?.message || 'Updates could not be loaded.'}
        </Alert>
      )}

      {isLoading ? (
        <Stack spacing={2}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} variant="rounded" height={150} sx={{ borderRadius: '16px' }} />
          ))}
        </Stack>
      ) : updates.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          {companyName} has not posted any updates yet.
        </Typography>
      ) : (
        <Stack spacing={2}>
          {updates.map((update) => (
            <Box
              key={update.id}
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
                <Avatar src={companyLogoUrl || undefined} alt="" variant="rounded">
                  {companyName.charAt(0)}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {companyName}
                    </Typography>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={UPDATE_TYPE_LABELS[update.type] ?? update.type}
                    />
                    {update.status !== 'published' && (
                      <Chip
                        size="small"
                        color={STATUS_COLORS[update.status]}
                        label={
                          update.status === 'scheduled' && update.scheduledAt
                            ? `Scheduled for ${formatDateTime(update.scheduledAt)}`
                            : update.status
                        }
                        sx={{ textTransform: 'capitalize' }}
                      />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(update.publishedAt || update.createdAt)}
                    </Typography>
                  </Stack>

                  {update.title && (
                    <Typography variant="h6" sx={{ fontWeight: 700, mt: 1 }}>
                      {update.title}
                    </Typography>
                  )}
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5, whiteSpace: 'pre-line' }}
                  >
                    {update.body}
                  </Typography>

                  {update.links?.length > 0 && (
                    <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                      {update.links.map((link) => (
                        <MuiLink
                          key={link}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          variant="body2"
                          underline="hover"
                        >
                          {link}
                        </MuiLink>
                      ))}
                    </Stack>
                  )}

                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <VisibilityIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {update.viewsCount}
                      </Typography>
                    </Stack>
                    {canCreate && (
                      <Tooltip title="Edit update">
                        <IconButton
                          size="small"
                          aria-label="Edit update"
                          onClick={() => openEditor(update)}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canDelete && (
                      <Tooltip title="Delete update">
                        <IconButton
                          size="small"
                          color="error"
                          aria-label="Delete update"
                          onClick={() => setDeleting(update)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
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

      <Dialog open={editorOpen} onClose={closeEditor} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? 'Edit update' : 'New company update'}
        </DialogTitle>
        <form onSubmit={onSubmit} noValidate>
          <DialogContent>
            <Stack spacing={2.5}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Type"
                    error={!!errors.type}
                    helperText={errors.type?.message}
                    fullWidth
                  >
                    {(Object.keys(UPDATE_TYPE_LABELS) as UpdateType[]).map((type) => (
                      <MenuItem key={type} value={type}>
                        {UPDATE_TYPE_LABELS[type]}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <Controller
                name="title"
                control={control}
                render={({ field }) => <TextField {...field} label="Title (optional)" fullWidth />}
              />

              <Controller
                name="body"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Update"
                    multiline
                    minRows={5}
                    error={!!errors.body}
                    helperText={errors.body?.message}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="links"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Links (one per line)"
                    multiline
                    minRows={2}
                    fullWidth
                  />
                )}
              />

              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="What happens next"
                    error={!!errors.status}
                    helperText={
                      errors.status?.message ??
                      (canPublish ? ' ' : 'You can draft updates; publishing needs update:publish')
                    }
                    fullWidth
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              {selectedStatus === 'scheduled' && (
                <Controller
                  name="scheduledAt"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      type="datetime-local"
                      label="Publish at"
                      InputLabelProps={{ shrink: true }}
                      error={!!errors.scheduledAt}
                      helperText={errors.scheduledAt?.message}
                      fullWidth
                    />
                  )}
                />
              )}

              {save.isError && (
                <Alert severity="error">
                  {save.error?.message || 'That update could not be saved.'}
                </Alert>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeEditor} disabled={save.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={save.isPending}>
              {save.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={!!deleting} onClose={() => setDeleting(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete this update?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            It will be removed from the company page and from anyone&apos;s feed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleting(null)} disabled={remove.isPending}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={remove.isPending}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
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

export default CompanyUpdates;

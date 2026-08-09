'use client';

/**
 * Company verification.
 *
 * Submitting here does not verify anything. A Kirmya administrator reviews the
 * claim and the documents, and only their approval sets the verified badge —
 * nothing on this screen can, which is why the status is read from the server
 * rather than assumed after a successful submit.
 *
 * Documents are links to files the company hosts. They are shown back to the
 * people who submitted them and to reviewing administrators; the module never
 * republishes them on the public page.
 */
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Chip,
  IconButton,
  Link as MuiLink,
  MenuItem,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VerifiedIcon from '@mui/icons-material/Verified';

import { useSubmitVerification, useVerification } from '../../features/company/hooks';
import { VerificationForm, validateDocumentUrl, verificationSchema } from '../../features/company/schemas';
import { VerificationDocument, VerificationStatus } from '../../features/company/types';
import GlassPanel from './GlassPanel';

const DOCUMENT_TYPES = [
  { value: 'incorporation_certificate', label: 'Certificate of incorporation' },
  { value: 'business_registration', label: 'Business registration' },
  { value: 'tax_document', label: 'Tax registration document' },
  { value: 'utility_bill', label: 'Utility bill at the registered address' },
  { value: 'domain_ownership', label: 'Proof of domain ownership' },
  { value: 'other', label: 'Other supporting document' },
];

const STATUS_TEXT: Record<VerificationStatus, { title: string; body: string; severity: 'info' | 'success' | 'warning' | 'error' }> = {
  not_verified: {
    title: 'Not verified',
    body: 'Submit your registration details and supporting documents to start a review.',
    severity: 'info',
  },
  pending: {
    title: 'Under review',
    body: 'A Kirmya administrator is reviewing this submission. The badge appears only if they approve it.',
    severity: 'warning',
  },
  verified: {
    title: 'Verified',
    body: 'An administrator approved this company. The verified badge is shown on the public page.',
    severity: 'success',
  },
  rejected: {
    title: 'Not approved',
    body: 'The review did not approve this submission. Correct the details below and submit again.',
    severity: 'error',
  },
  expired: {
    title: 'Verification expired',
    body: 'This verification has lapsed. Submit current documents to renew it.',
    severity: 'warning',
  },
};

/** A blank row for the documents table. */
const emptyDocument = (): VerificationDocument => ({
  documentType: 'business_registration',
  fileUrl: '',
  fileName: '',
  mimeType: '',
});

/** Derives a name and MIME type from the link, so two fields fill themselves. */
const describe = (url: string): { fileName: string; mimeType: string } => {
  const path = url.split(/[?#]/)[0];
  const fileName = decodeURIComponent(path.split('/').pop() ?? '').slice(0, 255);
  const extension = fileName.toLowerCase().split('.').pop() ?? '';
  const mimeType =
    { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' }[
      extension
    ] ?? '';
  return { fileName, mimeType };
};

interface CompanyVerificationProps {
  companyId: string;
  /** Whether the caller holds verification:submit. Viewing needs less. */
  canSubmit: boolean;
}

export const CompanyVerification: React.FC<CompanyVerificationProps> = ({
  companyId,
  canSubmit,
}) => {
  const { data, isLoading, isError, error } = useVerification(companyId);
  const submit = useSubmitVerification(companyId);

  const [documents, setDocuments] = React.useState<VerificationDocument[]>([emptyDocument()]);
  const [touched, setTouched] = React.useState(false);

  // The endpoint reports the company's status separately from the submission,
  // because a company can be unverified with nothing ever submitted.
  const status: VerificationStatus = data?.status ?? 'not_verified';
  const record = data?.verification ?? null;
  const copy = STATUS_TEXT[status];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VerificationForm>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      legalName: '',
      registrationNumber: '',
      registrationCountry: '',
      contactEmail: '',
    },
  });

  // Prefill from the last submission so a rejected claim is corrected, not
  // retyped. Only runs when the server's copy arrives.
  React.useEffect(() => {
    if (!record) return;
    reset({
      legalName: record.legalName ?? '',
      registrationNumber: record.registrationNumber ?? '',
      registrationCountry: record.registrationCountry ?? '',
      contactEmail: record.contactEmail ?? '',
    });
    if (record.documents?.length) setDocuments(record.documents);
  }, [record, reset]);

  const documentErrors = documents.map((document) =>
    document.fileUrl.trim() ? validateDocumentUrl(document.fileUrl).error : 'Add a link'
  );
  const documentsValid = documents.length > 0 && documentErrors.every((message) => !message);

  const update = (index: number, patch: Partial<VerificationDocument>) =>
    setDocuments((previous) =>
      previous.map((entry, i) => (i === index ? { ...entry, ...patch } : entry))
    );

  const onSubmit = handleSubmit((values) => {
    setTouched(true);
    if (!documentsValid) return;
    submit.mutate({
      ...values,
      documents: documents.map((document) => ({
        documentType: document.documentType,
        fileUrl: document.fileUrl.trim(),
        fileName: document.fileName.trim() || describe(document.fileUrl).fileName,
        mimeType: document.mimeType.trim() || describe(document.fileUrl).mimeType,
      })),
    });
  });

  if (isLoading) {
    return <Skeleton variant="rounded" height={320} sx={{ borderRadius: '20px' }} />;
  }

  return (
    <Stack spacing={3}>
      <Alert
        severity={copy.severity}
        icon={status === 'verified' ? <VerifiedIcon /> : undefined}
        sx={{ borderRadius: '16px' }}
      >
        <AlertTitle>{copy.title}</AlertTitle>
        {copy.body}
        {status === 'rejected' && record?.rejectionReason && (
          <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
            Reviewer&apos;s note: {record.rejectionReason}
          </Typography>
        )}
        {status === 'verified' && record?.expiresAt && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Valid until {new Date(record.expiresAt).toLocaleDateString()}.
          </Typography>
        )}
      </Alert>

      {isError && (
        <Alert severity="error" sx={{ borderRadius: '16px' }}>
          {error?.message || 'The verification status could not be loaded.'}
        </Alert>
      )}

      {record?.submittedAt && (
        <GlassPanel title="Last submission">
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            <Chip
              size="small"
              label={`Submitted ${new Date(record.submittedAt).toLocaleDateString()}`}
            />
            {record.reviewedAt && (
              <Chip
                size="small"
                label={`Reviewed ${new Date(record.reviewedAt).toLocaleDateString()}`}
              />
            )}
          </Stack>
          {record.documents?.length ? (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small" aria-label="Submitted documents">
                <TableHead>
                  <TableRow>
                    <TableCell>Document</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Link</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {record.documents.map((document, index) => (
                    <TableRow key={document.id ?? index}>
                      <TableCell>{document.fileName}</TableCell>
                      <TableCell>
                        {DOCUMENT_TYPES.find((entry) => entry.value === document.documentType)
                          ?.label ?? document.documentType}
                      </TableCell>
                      <TableCell>
                        <MuiLink
                          href={document.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="hover"
                        >
                          Open
                        </MuiLink>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No documents are attached to this submission.
            </Typography>
          )}
        </GlassPanel>
      )}

      {!canSubmit ? (
        <Alert severity="info" sx={{ borderRadius: '16px' }}>
          You can see the verification status but not submit one. That needs the verification
          permission.
        </Alert>
      ) : (
        <Box component="form" onSubmit={onSubmit}>
          <Stack spacing={3}>
            <GlassPanel
              title={status === 'verified' ? 'Resubmit' : 'Registration details'}
              description="These must match the company's registration exactly. An administrator checks them against the documents."
            >
              {submit.error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {(submit.error as Error).message}
                </Alert>
              )}
              {submit.isSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  Submitted for review. Nothing changes on the public page until an administrator
                  approves it.
                </Alert>
              )}

              <Box
                sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}
              >
                <TextField
                  {...register('legalName')}
                  label="Registered legal name"
                  required
                  error={!!errors.legalName}
                  helperText={errors.legalName?.message}
                />
                <TextField
                  {...register('registrationNumber')}
                  label="Registration number"
                  required
                  error={!!errors.registrationNumber}
                  helperText={errors.registrationNumber?.message}
                />
                <TextField
                  {...register('registrationCountry')}
                  label="Country of registration"
                  required
                  error={!!errors.registrationCountry}
                  helperText={errors.registrationCountry?.message}
                />
                <TextField
                  {...register('contactEmail')}
                  label="Contact email for the review"
                  type="email"
                  required
                  error={!!errors.contactEmail}
                  helperText={errors.contactEmail?.message ?? 'Where the reviewer will reach you.'}
                />
              </Box>
            </GlassPanel>

            <GlassPanel
              title="Supporting documents"
              description="Link to a PDF, PNG or JPEG. At least one document is required."
            >
              <Stack spacing={2}>
                {documents.map((document, index) => (
                  <Stack
                    key={index}
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={1.5}
                    alignItems={{ md: 'flex-start' }}
                  >
                    <TextField
                      select
                      label="Type"
                      value={document.documentType}
                      onChange={(event) => update(index, { documentType: event.target.value })}
                      sx={{ minWidth: 240 }}
                    >
                      {DOCUMENT_TYPES.map((entry) => (
                        <MenuItem key={entry.value} value={entry.value}>
                          {entry.label}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label="Document URL"
                      fullWidth
                      value={document.fileUrl}
                      onChange={(event) => {
                        const url = event.target.value;
                        // Both are re-derived on every keystroke rather than kept
                        // once set: a name taken from a half-typed link would
                        // otherwise stick, and the reviewer would be sent a
                        // document called "h".
                        update(index, { fileUrl: url, ...describe(url) });
                      }}
                      error={touched && !!documentErrors[index]}
                      helperText={(touched && documentErrors[index]) || document.fileName}
                    />
                    {documents.length > 1 && (
                      <IconButton
                        aria-label={`Remove document ${index + 1}`}
                        onClick={() =>
                          setDocuments((previous) => previous.filter((_, i) => i !== index))
                        }
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    )}
                  </Stack>
                ))}

                <Button
                  startIcon={<AddIcon />}
                  onClick={() => setDocuments((previous) => [...previous, emptyDocument()])}
                  sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                >
                  Add another document
                </Button>
              </Stack>
            </GlassPanel>

            <Button
              type="submit"
              variant="contained"
              disabled={submit.isPending || status === 'pending'}
              sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
            >
              {submit.isPending
                ? 'Submitting…'
                : status === 'pending'
                  ? 'A review is already in progress'
                  : 'Submit for review'}
            </Button>
          </Stack>
        </Box>
      )}
    </Stack>
  );
};

export default CompanyVerification;

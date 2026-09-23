'use client';

import React, { useState, useEffect } from 'react';
import {
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  Typography,
  Stack,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import Link from 'next/link';

import { tokens } from '../../theme/tokens';
import { useAuth } from '../../hooks/useAuth';
import { applicationsApi, CandidateDocument } from '../../features/applications/api';
import { JobDetail } from '../../features/jobs/types';
import { ROUTES } from '../../shared/routes';
import { useApplyJobSubmit } from './useApplyJobSubmit';
import { ApplyJobResumeSelector } from './ApplyJobResumeSelector';
import { ApplyJobFormFields } from './ApplyJobFormFields';

export interface ApplyJobModalProps {
  open: boolean;
  job: JobDetail;
  onClose: () => void;
  onSuccess?: (applicationId?: string) => void;
}

const STEPS = ['Contact Info', 'Select Resume', 'Cover Note', 'Screening', 'Review & Submit'];

export const ApplyJobModal: React.FC<ApplyJobModalProps> = ({
  open,
  job,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [activeStep, setActiveStep] = useState(0);
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [customResumeUrl, setCustomResumeUrl] = useState<string>('');
  const [coverLetter, setCoverLetter] = useState('');
  const [screeningAnswers, setScreeningAnswers] = useState<Record<string, string>>({});
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  // Submission logic hook
  const {
    isSubmitting,
    submitError,
    submittedAppId,
    setSubmitError,
    resetSubmission,
    handleSubmit,
  } = useApplyJobSubmit({ job, onSuccess });

  // Initialize candidate information & idempotency key on modal open
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      resetSubmission();
      setIdempotencyKey(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `apply-${Date.now()}`);

      if (user) {
        const candidateName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        setFullName(candidateName || 'Candidate');
        setEmail(user.email || '');
      }

      // Fetch candidate resumes
      setLoadingDocs(true);
      applicationsApi
        .getDocuments()
        .then((docs) => {
          setDocuments(docs || []);
          const defaultDoc = docs.find((d) => d.is_default || d.document_type === 'Resume');
          if (defaultDoc) {
            setSelectedResumeId(defaultDoc.id);
            setCustomResumeUrl(defaultDoc.file_url);
          } else if (docs.length > 0) {
            setSelectedResumeId(docs[0].id);
            setCustomResumeUrl(docs[0].file_url);
          }
        })
        .catch(() => {
          setDocuments([]);
        })
        .finally(() => {
          setLoadingDocs(false);
        });
    }
  }, [open, user]);

  const handleResumeSelection = (docId: string) => {
    setSelectedResumeId(docId);
    const found = documents.find((d) => d.id === docId);
    if (found) {
      setCustomResumeUrl(found.file_url);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setScreeningAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  // Optional phone: empty is fine; if provided, require a plausible international number.
  const isValidPhone = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return true;
    const digits = trimmed.replace(/[^\d+]/g, '');
    return /^\+?\d{7,15}$/.test(digits);
  };

  const hasResume = Boolean(selectedResumeId || customResumeUrl.trim());

  const unansweredRequiredScreening = (job.screening_questions || []).filter((q, idx) => {
    if (!q.required) return false;
    const key = q.id || `q-${idx}`;
    return !(screeningAnswers[key] || '').trim();
  });

  const handleNext = () => {
    setSubmitError(null);
    if (activeStep === 0) {
      if (!email.trim() || !isValidEmail(email)) {
        setSubmitError('Please provide a valid email address.');
        return;
      }
      if (!fullName.trim()) {
        setSubmitError('Please provide your full name.');
        return;
      }
      if (!isValidPhone(phone)) {
        setSubmitError('Please enter a valid phone number, or leave it blank.');
        return;
      }
    }
    if (activeStep === 1 && !hasResume) {
      setSubmitError('Please select a resume or provide a document link.');
      return;
    }
    if (activeStep === 3 && unansweredRequiredScreening.length > 0) {
      setSubmitError('Please answer all required screening questions.');
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setSubmitError(null);
    setActiveStep((prev) => prev - 1);
  };

  const onSubmit = () => {
    if (!email.trim() || !isValidEmail(email)) {
      setSubmitError('Please provide a valid email address.');
      return;
    }
    if (!isValidPhone(phone)) {
      setSubmitError('Please enter a valid phone number, or leave it blank.');
      return;
    }
    if (!hasResume) {
      setSubmitError('Please select a resume or provide a document link.');
      return;
    }
    if (unansweredRequiredScreening.length > 0) {
      setSubmitError('Please answer all required screening questions.');
      return;
    }
    handleSubmit({
      selectedResumeId,
      coverLetter,
      screeningAnswers,
      idempotencyKey,
      contactName: fullName,
      contactEmail: email,
      contactPhone: phone,
    });
  };

  // Render Success Confirmation
  const renderSuccess = () => (
    <Stack spacing={3} sx={{ py: 4, textAlign: 'center' }} alignItems="center">
      <CheckCircleOutlineIcon color="success" sx={{ fontSize: 64 }} />
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
          Application Submitted Successfully!
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: 'auto' }}>
          Your application for <strong>{job.title}</strong> at <strong>{job.company_name}</strong> has been received and routed directly to the hiring team.
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: `${tokens.radius.md}px`,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'action.hover',
          maxWidth: 400,
          width: '100%',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Status: <strong>Applied</strong> • Immediate Recruiter Visibility
        </Typography>
      </Paper>

      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          component={Link}
          href={ROUTES.APPLICATIONS}
          onClick={onClose}
          sx={{ borderRadius: `${tokens.radius.md}px`, px: 3 }}
        >
          Track in Applications Hub
        </Button>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ borderRadius: `${tokens.radius.md}px`, px: 3 }}
        >
          Close
        </Button>
      </Stack>
    </Stack>
  );

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      aria-labelledby="apply-job-dialog-title"
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : `${tokens.radius.lg}px`,
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box>
          <Typography id="apply-job-dialog-title" variant="h6" sx={{ fontWeight: 700 }}>
            {submittedAppId ? 'Application Complete' : `Apply to ${job.title}`}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {job.company_name}
          </Typography>
        </Box>
        {!isSubmitting && (
          <IconButton onClick={onClose} size="small" aria-label="close">
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent dividers sx={{ minHeight: 360, py: 3 }}>
        {submittedAppId ? (
          renderSuccess()
        ) : (
          <>
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
              {STEPS.map((label, index) => (
                <Step key={label}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor:
                            activeStep === index
                              ? 'primary.main'
                              : activeStep > index
                              ? 'success.main'
                              : 'action.disabledBackground',
                          color: '#fff',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                        }}
                      >
                        {activeStep > index ? '✓' : index + 1}
                      </Box>
                    )}
                  >
                    <Typography variant="caption" sx={{ fontWeight: activeStep === index ? 700 : 500 }}>
                      {label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {submitError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: `${tokens.radius.md}px` }}>
                {submitError}
              </Alert>
            )}

            {activeStep === 1 ? (
              <ApplyJobResumeSelector
                documents={documents}
                loadingDocs={loadingDocs}
                selectedResumeId={selectedResumeId}
                customResumeUrl={customResumeUrl}
                onResumeSelect={handleResumeSelection}
                onCustomResumeUrlChange={setCustomResumeUrl}
              />
            ) : (
              <ApplyJobFormFields
                activeStep={activeStep}
                job={job}
                fullName={fullName}
                onFullNameChange={setFullName}
                email={email}
                onEmailChange={setEmail}
                phone={phone}
                onPhoneChange={setPhone}
                coverLetter={coverLetter}
                onCoverLetterChange={setCoverLetter}
                screeningAnswers={screeningAnswers}
                onScreeningAnswerChange={handleAnswerChange}
                documents={documents}
                selectedResumeId={selectedResumeId}
                customResumeUrl={customResumeUrl}
              />
            )}
          </>
        )}
      </DialogContent>

      {!submittedAppId && (
        <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
          <Button
            onClick={handleBack}
            disabled={activeStep === 0 || isSubmitting}
            startIcon={<ArrowBackIcon />}
            sx={{ borderRadius: `${tokens.radius.md}px` }}
          >
            Back
          </Button>

          <Stack direction="row" spacing={1.5}>
            <Button
              onClick={onClose}
              disabled={isSubmitting}
              sx={{ borderRadius: `${tokens.radius.md}px`, color: 'text.secondary' }}
            >
              Cancel
            </Button>

            {activeStep < STEPS.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForwardIcon />}
                sx={{ borderRadius: `${tokens.radius.md}px`, px: 3 }}
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={onSubmit}
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                sx={{ borderRadius: `${tokens.radius.md}px`, px: 3, fontWeight: 700 }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            )}
          </Stack>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default ApplyJobModal;

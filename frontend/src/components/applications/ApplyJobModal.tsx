'use client';

import React, { useState, useEffect } from 'react';
import {
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
  TextField,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  FormLabel,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  Chip,
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

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  // Initialize candidate information & idempotency key on modal open
  useEffect(() => {
    if (open) {
      setActiveStep(0);
      setSubmitError(null);
      setSubmittedAppId(null);
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

  const handleNext = () => {
    setSubmitError(null);
    if (activeStep === 0 && !email.trim()) {
      setSubmitError('Please provide a valid email address.');
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setSubmitError(null);
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const questionsList = (job.screening_questions || []).map((q, idx) => ({
      question_id: q.id || `q-${idx}`,
      question_text: q.question || `Screening Question #${idx + 1}`,
      answer: screeningAnswers[q.id || `q-${idx}`] || 'N/A',
    }));

    try {
      const response = await applicationsApi.applyToJob({
        job_id: job.id,
        resume_id: selectedResumeId || undefined,
        cover_letter: coverLetter.trim() || undefined,
        answers: questionsList.length > 0 ? questionsList : undefined,
        idempotency_key: idempotencyKey,
      });

      const newAppId = response?.summary?.id || '';
      setSubmittedAppId(newAppId);
      onSuccess?.(newAppId);
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Failed to submit your application. Please check your network and try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Step 0: Contact Info
  const renderContactInfo = () => (
    <Stack spacing={2.5}>
      <Typography variant="body2" color="text.secondary">
        Verify your contact details for <strong>{job.company_name}</strong> recruiters.
      </Typography>

      <TextField
        fullWidth
        label="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        required
        variant="outlined"
      />
      <TextField
        fullWidth
        label="Email Address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        variant="outlined"
      />
      <TextField
        fullWidth
        label="Phone Number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+1 (555) 000-0000"
        variant="outlined"
      />
    </Stack>
  );

  // Render Step 1: Resume Selection
  const renderResumeSelection = () => (
    <Stack spacing={2.5}>
      <Typography variant="body2" color="text.secondary">
        Select a tailored resume from your profile or provide a document link.
      </Typography>

      {loadingDocs ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : documents.length > 0 ? (
        <FormControl component="fieldset">
          <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
            Uploaded Resumes & Documents
          </FormLabel>
          <RadioGroup
            value={selectedResumeId}
            onChange={(e) => handleResumeSelection(e.target.value)}
          >
            {documents.map((doc) => (
              <Paper
                key={doc.id}
                elevation={0}
                sx={{
                  p: 1.5,
                  mb: 1.5,
                  borderRadius: `${tokens.radius.md}px`,
                  border: '1px solid',
                  borderColor: selectedResumeId === doc.id ? 'primary.main' : 'divider',
                  bgcolor: selectedResumeId === doc.id ? 'action.selected' : 'background.paper',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => handleResumeSelection(doc.id)}
              >
                <FormControlLabel
                  value={doc.id}
                  control={<Radio size="small" />}
                  label={
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {doc.title || 'Resume Document'}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                        <Chip label={doc.document_type || 'Resume'} size="small" variant="outlined" />
                        {doc.is_default && <Chip label="Default" size="small" color="primary" />}
                        <Typography variant="caption" color="text.secondary">
                          Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                        </Typography>
                      </Stack>
                    </Box>
                  }
                  sx={{ width: '100%', m: 0 }}
                />
              </Paper>
            ))}
          </RadioGroup>
        </FormControl>
      ) : (
        <Alert severity="info" sx={{ borderRadius: `${tokens.radius.md}px` }}>
          No resumes found in your profile library. You can provide a direct resume link below or upload one in your Profile documents.
        </Alert>
      )}

      <TextField
        fullWidth
        label="Direct Resume / Portfolio URL (Optional)"
        placeholder="https://storage.kirmya.com/resumes/my-resume.pdf"
        value={customResumeUrl}
        onChange={(e) => setCustomResumeUrl(e.target.value)}
        helperText="Recruiters will be able to review this document securely."
      />
    </Stack>
  );

  // Render Step 2: Cover Letter
  const renderCoverLetter = () => (
    <Stack spacing={2.5}>
      <Typography variant="body2" color="text.secondary">
        Add a personalized note or cover statement explaining why you are a great fit for the <strong>{job.title}</strong> role.
      </Typography>

      <TextField
        fullWidth
        multiline
        rows={6}
        label="Cover Note / Motivation (Optional)"
        placeholder="Dear Hiring Team, I am thrilled to apply for the role because..."
        value={coverLetter}
        onChange={(e) => setCoverLetter(e.target.value)}
        inputProps={{ maxLength: 2000 }}
        helperText={`${coverLetter.length}/2000 characters`}
      />
    </Stack>
  );

  // Render Step 3: Screening Questions
  const renderScreening = () => {
    const questions = job.screening_questions || [];

    if (questions.length === 0) {
      return (
        <Stack spacing={2} sx={{ py: 2, textAlign: 'center' }}>
          <CheckCircleOutlineIcon color="success" sx={{ fontSize: 48, mx: 'auto' }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            No Screening Questions Required
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {job.company_name} does not require extra questionnaire responses for this position. Proceed to final review!
          </Typography>
        </Stack>
      );
    }

    return (
      <Stack spacing={3}>
        <Typography variant="body2" color="text.secondary">
          Please answer the employer screening questions below:
        </Typography>

        {questions.map((q, idx) => {
          const qId = q.id || `q-${idx}`;
          return (
            <Paper
              key={qId}
              elevation={0}
              sx={{
                p: 2,
                borderRadius: `${tokens.radius.md}px`,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Question {idx + 1}: {q.question || 'Required information'}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="Your response..."
                value={screeningAnswers[qId] || ''}
                onChange={(e) => handleAnswerChange(qId, e.target.value)}
                variant="outlined"
                size="small"
              />
            </Paper>
          );
        })}
      </Stack>
    );
  };

  // Render Step 4: Review & Submit
  const renderReview = () => {
    const selectedDoc = documents.find((d) => d.id === selectedResumeId);

    return (
      <Stack spacing={2.5}>
        <Alert severity="info" sx={{ borderRadius: `${tokens.radius.md}px` }}>
          Please review your application summary before final submission.
        </Alert>

        {/* Job Summary Card */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: `${tokens.radius.md}px`,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
            Position
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {job.title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {job.company_name} • {job.location || 'Remote'} • {job.employment_type || 'Full-time'}
          </Typography>
        </Paper>

        {/* Candidate Info Summary */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: `${tokens.radius.md}px`,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Applicant Profile
          </Typography>
          <Typography variant="body2"><strong>Name:</strong> {fullName}</Typography>
          <Typography variant="body2"><strong>Email:</strong> {email}</Typography>
          {phone && <Typography variant="body2"><strong>Phone:</strong> {phone}</Typography>}
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="body2">
            <strong>Attached Resume:</strong>{' '}
            {selectedDoc ? selectedDoc.title : customResumeUrl ? customResumeUrl : 'Default Profile Resume'}
          </Typography>
          {coverLetter && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                &ldquo;{coverLetter.length > 150 ? coverLetter.slice(0, 150) + '...' : coverLetter}&rdquo;
              </Typography>
            </>
          )}
        </Paper>
      </Stack>
    );
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
      PaperProps={{
        sx: {
          borderRadius: `${tokens.radius.lg}px`,
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
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

            {activeStep === 0 && renderContactInfo()}
            {activeStep === 1 && renderResumeSelection()}
            {activeStep === 2 && renderCoverLetter()}
            {activeStep === 3 && renderScreening()}
            {activeStep === 4 && renderReview()}
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
                onClick={handleSubmit}
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

'use client';

import React from 'react';
import {
  Stack,
  Typography,
  TextField,
  Paper,
  Alert,
  Divider,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

import { tokens } from '../../theme/tokens';
import { JobDetail } from '../../features/jobs/types';
import { CandidateDocument } from '../../features/applications/api';

export interface ApplyJobFormFieldsProps {
  activeStep: number;
  job: JobDetail;
  fullName: string;
  onFullNameChange: (val: string) => void;
  email: string;
  onEmailChange: (val: string) => void;
  phone: string;
  onPhoneChange: (val: string) => void;
  coverLetter: string;
  onCoverLetterChange: (val: string) => void;
  screeningAnswers: Record<string, string>;
  onScreeningAnswerChange: (questionId: string, answer: string) => void;
  documents: CandidateDocument[];
  selectedResumeId: string;
  customResumeUrl: string;
}

export const ApplyJobFormFields: React.FC<ApplyJobFormFieldsProps> = ({
  activeStep,
  job,
  fullName,
  onFullNameChange,
  email,
  onEmailChange,
  phone,
  onPhoneChange,
  coverLetter,
  onCoverLetterChange,
  screeningAnswers,
  onScreeningAnswerChange,
  documents,
  selectedResumeId,
  customResumeUrl,
}) => {
  // Step 0: Contact Info
  if (activeStep === 0) {
    return (
      <Stack spacing={2.5}>
        <Typography variant="body2" color="text.secondary">
          Verify your contact details for <strong>{job.company_name}</strong> recruiters.
        </Typography>

        <TextField
          fullWidth
          label="Full Name"
          value={fullName}
          onChange={(e) => onFullNameChange(e.target.value)}
          required
          variant="outlined"
        />
        <TextField
          fullWidth
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          required
          variant="outlined"
        />
        <TextField
          fullWidth
          label="Phone Number (optional)"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="+1 (555) 000-0000"
          variant="outlined"
          helperText="Optional. Include country code if you provide one."
        />
      </Stack>
    );
  }

  // Step 2: Cover Letter
  if (activeStep === 2) {
    return (
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
          onChange={(e) => onCoverLetterChange(e.target.value)}
          inputProps={{ maxLength: 2000 }}
          helperText={`${coverLetter.length}/2000 characters`}
        />
      </Stack>
    );
  }

  // Step 3: Screening Questions
  if (activeStep === 3) {
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
                onChange={(e) => onScreeningAnswerChange(qId, e.target.value)}
                variant="outlined"
                size="small"
              />
            </Paper>
          );
        })}
      </Stack>
    );
  }

  // Step 4: Review & Submit
  if (activeStep === 4) {
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
  }

  return null;
};

export default ApplyJobFormFields;

'use client';

import { useState } from 'react';
import { applicationsApi } from '../../features/applications/api';
import { JobDetail } from '../../features/jobs/types';

export interface SubmitApplicationData {
  selectedResumeId?: string;
  coverLetter?: string;
  screeningAnswers: Record<string, string>;
  idempotencyKey: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface UseApplyJobSubmitParams {
  job: JobDetail;
  onSuccess?: (applicationId?: string) => void;
}

export interface UseApplyJobSubmitReturn {
  isSubmitting: boolean;
  submitError: string | null;
  submittedAppId: string | null;
  setSubmitError: React.Dispatch<React.SetStateAction<string | null>>;
  setSubmittedAppId: React.Dispatch<React.SetStateAction<string | null>>;
  resetSubmission: () => void;
  handleSubmit: (data: SubmitApplicationData) => Promise<void>;
}

export function useApplyJobSubmit({
  job,
  onSuccess,
}: UseApplyJobSubmitParams): UseApplyJobSubmitReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  const resetSubmission = () => {
    setIsSubmitting(false);
    setSubmitError(null);
    setSubmittedAppId(null);
  };

  const handleSubmit = async ({
    selectedResumeId,
    coverLetter,
    screeningAnswers,
    idempotencyKey,
    contactName,
    contactEmail,
    contactPhone,
  }: SubmitApplicationData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    const questionsList = (job.screening_questions || []).map((q, idx) => {
      const key = q.id || `q-${idx}`;
      return {
        question_id: key,
        question_text: q.question || `Screening Question #${idx + 1}`,
        answer: (screeningAnswers[key] || '').trim(),
      };
    }).filter((item) => item.answer.length > 0);

    try {
      const response = await applicationsApi.applyToJob({
        job_id: job.id,
        resume_id: selectedResumeId || undefined,
        cover_letter: coverLetter?.trim() || undefined,
        answers: questionsList.length > 0 ? questionsList : undefined,
        idempotency_key: idempotencyKey,
        contact_name: contactName?.trim() || undefined,
        contact_email: contactEmail?.trim() || undefined,
        contact_phone: contactPhone?.trim() || undefined,
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

  return {
    isSubmitting,
    submitError,
    submittedAppId,
    setSubmitError,
    setSubmittedAppId,
    resetSubmission,
    handleSubmit,
  };
}

export default useApplyJobSubmit;

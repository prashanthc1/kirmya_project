'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import ProgressStepper from '../../components/onboarding/ProgressStepper';
import WelcomeStep from '../../components/onboarding/WelcomeStep';
import PhotoUploadStep from '../../components/onboarding/PhotoUploadStep';
import PersonalInfoStep from '../../components/onboarding/PersonalInfoStep';
import ProfessionalInfoStep from '../../components/onboarding/ProfessionalInfoStep';
import SkillsStep from '../../components/onboarding/SkillsStep';
import ExperienceStep from '../../components/onboarding/ExperienceStep';
import EducationStep from '../../components/onboarding/EducationStep';
import CertificationStep from '../../components/onboarding/CertificationStep';
import ResumeUploadStep from '../../components/onboarding/ResumeUploadStep';
import CareerPreferencesStep from '../../components/onboarding/CareerPreferencesStep';
import JobAlertsStep from '../../components/onboarding/JobAlertsStep';
import CommunitiesStep from '../../components/onboarding/CommunitiesStep';
import ConnectionsStep from '../../components/onboarding/ConnectionsStep';
import AIReviewStep from '../../components/onboarding/AIReviewStep';
import CompletionStep from '../../components/onboarding/CompletionStep';

import { onboardingApi } from '../../features/onboarding/api';
import { FEATURES } from '../../shared/features';
import { useAuth } from '../../features/auth/context/authContext';

const LAST_STEP = 15;

// Connection suggestions and the AI profile review belong to areas that are
// hidden for now (shared/features). The steps keep their numbers, because the
// saved progress is a step number, and are stepped over in both directions.
const SKIPPED_STEPS = new Set<number>([
  ...(FEATURES.networking ? [] : [13]),
  ...(FEATURES.ai ? [] : [14]),
]);

const stepFrom = (step: number, direction: 1 | -1): number => {
  let next = step;
  while (SKIPPED_STEPS.has(next) && next > 1 && next < LAST_STEP) next += direction;
  return next;
};

export default function OnboardingPage() {
  const router = useRouter();
  const { loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    // Wait for the session restore to settle, otherwise the first request goes
    // out without an access token and reads the demo user's progress.
    if (authLoading) return;

    onboardingApi
      .getProgress()
      .then((res) => {
        if (res.is_completed) {
          router.push('/jobs');
        } else if (res.current_step > 1) {
          setCurrentStep(stepFrom(res.current_step, 1));
        }
      })
      .catch(() => {});
  }, [authLoading, router]);

  const handleNextStep = (stepData?: any) => {
    if (stepData) {
      setFormData((prev: any) => ({ ...prev, ...stepData }));
    }

    const next = stepFrom(Math.min(currentStep + 1, LAST_STEP), 1);
    setCurrentStep(next);
    onboardingApi.saveProgress(next).catch(() => {});
  };

  const handlePrevStep = () => {
    const prev = stepFrom(Math.max(currentStep - 1, 1), -1);
    setCurrentStep(prev);
    onboardingApi.saveProgress(prev).catch(() => {});
  };

  const handleFinishOnboarding = () => {
    onboardingApi
      .completeOnboarding()
      .then(() => {
        router.push('/jobs');
      })
      .catch(() => {
        router.push('/jobs');
      });
  };

  const renderStepComponent = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep onNext={handleNextStep} />;
      case 2:
        return <PhotoUploadStep onNext={handleNextStep} onPrev={handlePrevStep} />;
      case 3:
        return <PersonalInfoStep onNext={handleNextStep} onPrev={handlePrevStep} />;
      case 4:
        return <ProfessionalInfoStep onNext={handleNextStep} onPrev={handlePrevStep} />;
      case 5:
        return <SkillsStep onNext={handleNextStep} onPrev={handlePrevStep} />;
      case 6:
        return <ExperienceStep onNext={handleNextStep} onPrev={handlePrevStep} />;
      case 7:
        return <EducationStep onNext={handleNextStep} onPrev={handlePrevStep} />;
      case 8:
        return <CertificationStep onNext={handleNextStep} onPrev={handlePrevStep} />;
      case 9:
        return <ResumeUploadStep onNext={handleNextStep} onPrev={handlePrevStep} />;
      case 10:
        return <CareerPreferencesStep onNext={handleNextStep} onPrev={handlePrevStep} />;
      case 11:
        return <JobAlertsStep onNext={handleNextStep} onPrev={handlePrevStep} />;
      case 12:
        return <CommunitiesStep onNext={handleNextStep} onPrev={handlePrevStep} />;
      case 13:
        return <ConnectionsStep onNext={handleNextStep} onPrev={handlePrevStep} />;
      case 14:
        return <AIReviewStep onNext={handleNextStep} onPrev={handlePrevStep} />;
      case 15:
        return <CompletionStep onFinish={handleFinishOnboarding} />;
      default:
        return <WelcomeStep onNext={handleNextStep} />;
    }
  };

  return (
    <OnboardingLayout onSaveProgress={() => onboardingApi.saveProgress(currentStep)}>
      <ProgressStepper currentStep={currentStep} totalSteps={15} />
      {/*
        mode="wait" so the outgoing step finishes leaving before the next
        arrives — two steps cross-fading through each other reads as a glitch.
        The key is what tells AnimatePresence a step was replaced; each step's
        own motion.div carries the mirrored exit.
      */}
      <AnimatePresence mode="wait">
        <Box key={currentStep} sx={{ mt: 2 }}>
          {renderStepComponent()}
        </Box>
      </AnimatePresence>
    </OnboardingLayout>
  );
}

'use client';

import React from 'react';
import { resumeApi } from '@/features/resume/api';
import { ResumeBuilder } from '@/components/resume/ResumeBuilder';

export const dynamic = 'force-dynamic';

export default function CreateResumePage() {
  return (
    <ResumeBuilder
      onCreateResume={async (title, template) => {
        return await resumeApi.createResume({ title, templateName: template });
      }}
    />
  );
}

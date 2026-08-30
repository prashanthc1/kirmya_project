'use client';

import React from 'react';
import { Container } from '@mui/material';

import AuthenticatedLayout from '../../../../components/shell/AuthenticatedLayout';
import { resumeApi } from '../../../../features/resume/api';
import { ResumeBuilder } from '../../../../components/resume/ResumeBuilder';

export const dynamic = 'force-dynamic';

export default function CreateResumePage() {
  return (
    <AuthenticatedLayout>
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <ResumeBuilder
          onCreateResume={async (title, template) => {
            return await resumeApi.createResume({ title, templateName: template });
          }}
        />
      </Container>
    </AuthenticatedLayout>
  );
}

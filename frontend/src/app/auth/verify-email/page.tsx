'use client';

import React, { Suspense } from 'react';
import { Skeleton, Stack } from '@mui/material';
import AuthLayout from '../../../components/auth/AuthLayout';
import AuthCard from '../../../components/auth/AuthCard';
import EmailVerificationView from '../../../components/auth/EmailVerificationView';
import AuthErrorBoundary from '../../../components/auth/ErrorBoundary';

export const dynamic = 'force-dynamic';

function VerifyEmailContent() {
  return (
    <AuthCard>
      <EmailVerificationView />
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthErrorBoundary>
      <AuthLayout>
        <Suspense
          fallback={
            <AuthCard>
              <Stack spacing={2}>
                <Skeleton variant="rounded" height={40} />
                <Skeleton variant="rounded" height={120} />
                <Skeleton variant="rounded" height={48} />
              </Stack>
            </AuthCard>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </AuthLayout>
    </AuthErrorBoundary>
  );
}

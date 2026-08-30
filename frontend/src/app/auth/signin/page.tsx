'use client';

import React, { Suspense } from 'react';
import { Skeleton, Stack } from '@mui/material';
import AuthLayout from '../../../components/auth/AuthLayout';
import AuthCard from '../../../components/auth/AuthCard';
import SignInForm from '../../../components/auth/SignInForm';
import AuthErrorBoundary from '../../../components/auth/ErrorBoundary';

export const dynamic = 'force-dynamic';

export default function SignInAppPage() {
  return (
    <AuthErrorBoundary>
      <AuthLayout>
        <Suspense
          fallback={
            <AuthCard>
              <Stack spacing={2}>
                <Skeleton variant="rounded" height={40} />
                <Skeleton variant="rounded" height={160} />
                <Skeleton variant="rounded" height={48} />
              </Stack>
            </AuthCard>
          }
        >
          <AuthCard>
            <SignInForm />
          </AuthCard>
        </Suspense>
      </AuthLayout>
    </AuthErrorBoundary>
  );
}

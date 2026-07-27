'use client';

import React from 'react';
import AuthLayout from '../../../components/auth/AuthLayout';
import SignUpForm from '../../../components/auth/SignUpForm';
import AuthErrorBoundary from '../../../components/auth/ErrorBoundary';

export default function SignUpAppPage() {
  return (
    <AuthErrorBoundary>
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </AuthErrorBoundary>
  );
}

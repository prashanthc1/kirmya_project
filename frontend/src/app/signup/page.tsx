'use client';

import React from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import SignUpForm from '../../components/auth/SignUpForm';
import AuthErrorBoundary from '../../components/auth/ErrorBoundary';

export default function SignUpPage() {
  return (
    <AuthErrorBoundary>
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </AuthErrorBoundary>
  );
}

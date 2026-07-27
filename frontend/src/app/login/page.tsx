'use client';

import React from 'react';
import AuthLayout from '../../components/auth/AuthLayout';
import SignInForm from '../../components/auth/SignInForm';
import AuthErrorBoundary from '../../components/auth/ErrorBoundary';

export default function LoginPage() {
  return (
    <AuthErrorBoundary>
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </AuthErrorBoundary>
  );
}

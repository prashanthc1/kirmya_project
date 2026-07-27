'use client';

import { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { LoginPayload } from '../services/authService';

export const useLogin = () => {
  const { login: loginContext, user } = useAuthContext();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (payload: LoginPayload) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await loginContext(payload);
      return res;
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        'Authentication failed. Please check your credentials and network connection.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    login,
    submitting,
    error,
    setError,
    user,
  };
};

export default useLogin;

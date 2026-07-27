'use client';

import { useState } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { RegisterPayload } from '../services/authService';

export const useRegister = () => {
  const { register: registerContext } = useAuthContext();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  const register = async (payload: RegisterPayload) => {
    setSubmitting(true);
    setError(null);
    setSuccessData(null);
    try {
      const res = await registerContext(payload);
      setSuccessData(res);
      return res;
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        'Registration failed. Please check your details and try again.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    register,
    submitting,
    error,
    setError,
    successData,
  };
};

export default useRegister;

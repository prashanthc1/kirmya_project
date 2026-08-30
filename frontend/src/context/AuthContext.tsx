'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, UserProfile, LoginPayload, RegisterPayload } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  permissions: string[];
  notificationsCount: number;
  setNotificationsCount: React.Dispatch<React.SetStateAction<number>>;
  loading: boolean;
  authenticated: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<any>;
  register: (payload: RegisterPayload) => Promise<any>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<any>;
  resendVerification: (email: string) => Promise<any>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [notificationsCount, setNotificationsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshAuth = useCallback(async () => {
    try {
      setLoading(true);
      // Attempt refresh token cookie exchange first
      await authService.refresh();
      const me = await authService.getMe();
      setUser(me.user);
      setPermissions(me.permissions || []);
      setNotificationsCount(me.notificationsCount || 0);
    } catch {
      setUser(null);
      setPermissions([]);
      setNotificationsCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = async (payload: LoginPayload) => {
    setLoading(true);
    try {
      const data = await authService.login(payload);
      setUser(data.user);
      // Fetch permissions & profile details
      try {
        const me = await authService.getMe();
        setPermissions(me.permissions || []);
        setNotificationsCount(me.notificationsCount || 0);
      } catch {
        // fallback defaults
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setLoading(true);
    try {
      return await authService.register(payload);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setPermissions([]);
      setNotificationsCount(0);
      setLoading(false);
    }
  };

  const verifyEmail = async (token: string) => {
    return await authService.verifyEmail(token);
  };

  const resendVerification = async (email: string) => {
    return await authService.resendVerification(email);
  };

  const isAuthed = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        notificationsCount,
        setNotificationsCount,
        loading,
        authenticated: isAuthed,
        isAuthenticated: isAuthed,
        login,
        register,
        logout,
        verifyEmail,
        resendVerification,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { authApi } from '../services/authApi';

interface User {
  id: string;
  email: string;
  isActive: boolean;
}

interface AuthContextType {
  accessToken: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  accessToken: null,
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

// Global axios client setup for general app operations
export const appClient = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Attach request interceptor to inject in-memory token
  useEffect(() => {
    const reqInterceptor = appClient.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      appClient.interceptors.request.eject(reqInterceptor);
    };
  }, [accessToken]);

  // Attach response interceptor for automatic 401 token rotation retry
  useEffect(() => {
    const resInterceptor = appClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            // Attempt silent rotation
            const { accessToken: newAccessToken } = await authApi.refresh();
            setAccessToken(newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return appClient(originalRequest); // Retry original request
          } catch (refreshError) {
            // Refresh token expired or revoked, clean up local auth state
            setAccessToken(null);
            setUser(null);
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      appClient.interceptors.response.eject(resInterceptor);
    };
  }, []);

  // Perform silent refresh on app startup
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { accessToken: newAccessToken } = await authApi.refresh();
        setAccessToken(newAccessToken);
        // Load mock user session metadata locally
        setUser({
          id: '9a8b7c6d-5e4f-3a2b-1c0d-9e8f7a6b5c4d',
          email: 'developer@kirmya.ae',
          isActive: true,
        });
      } catch (err) {
        console.warn('Initial session refresh failed. Proceeding as Guest.');
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // Setup periodic refresh timer (every 14 minutes)
  useEffect(() => {
    if (!accessToken) return;

    const timer = setInterval(async () => {
      try {
        const { accessToken: newAccessToken } = await authApi.refresh();
        setAccessToken(newAccessToken);
      } catch (err) {
        setAccessToken(null);
        setUser(null);
      }
    }, 14 * 60 * 1000); // 14 mins

    return () => clearInterval(timer);
  }, [accessToken]);

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setAccessToken(data.accessToken);
    setUser(data.user);
  };

  const register = async (email: string, password: string) => {
    await authApi.register(email, password);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!accessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

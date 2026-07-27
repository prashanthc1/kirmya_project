import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const authApiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// In-memory access token storage
let accessTokenInMemory: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessTokenInMemory = token;
};

export const getAccessToken = () => accessTokenInMemory;

// Request interceptor: attach bearer access token
authApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessTokenInMemory && config.headers) {
      config.headers.Authorization = `Bearer ${accessTokenInMemory}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: auto-refresh access token on 401 error
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

authApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return authApiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newAccessToken = data.accessToken;
        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return authApiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAccessToken(null);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// Types
export interface UserProfile {
  id: string;
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  roleId: string;
  status: string;
  country?: string;
  currentLocation?: string;
  jobTitle?: string;
  employmentStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  country?: string;
  currentLocation?: string;
  jobTitle?: string;
  employmentStatus?: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  subscribeCareerUpdates?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface UserMeResponse {
  user: UserProfile;
  permissions: string[];
  notificationsCount: number;
}

export interface SessionResponse {
  id: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: string;
  isActive: boolean;
}

export const authService = {
  async register(payload: RegisterPayload) {
    const res = await authApiClient.post('/auth/register', payload);
    return res.data;
  },

  async login(payload: LoginPayload) {
    const res = await authApiClient.post('/auth/login', payload);
    if (res.data.accessToken) {
      setAccessToken(res.data.accessToken);
    }
    return res.data;
  },

  async logout() {
    try {
      await authApiClient.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  async refresh() {
    const res = await authApiClient.post('/auth/refresh');
    if (res.data.accessToken) {
      setAccessToken(res.data.accessToken);
    }
    return res.data;
  },

  async verifyEmail(token: string) {
    const res = await authApiClient.post('/auth/verify-email', { token });
    return res.data;
  },

  async resendVerification(email: string) {
    const res = await authApiClient.post('/auth/resend-verification', { email });
    return res.data;
  },

  async getMe(): Promise<UserMeResponse> {
    const res = await authApiClient.get('/auth/me');
    return res.data;
  },

  async getSession(): Promise<SessionResponse> {
    const res = await authApiClient.get('/auth/session');
    return res.data;
  },
};

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { Workspace } from '../shared/workspace/types';

/**
 * The single API base every authenticated call goes through.
 *
 * NEXT_PUBLIC_API_URL is documented as including the version prefix, but the
 * root .env.example published it without one, so a developer who copied the
 * documented value got every auth call sent to /auth/refresh instead of
 * /api/v1/auth/refresh — a 404 that reads as "the session did not survive the
 * reload". Normalising here means either spelling reaches the same endpoints.
 */
const resolveApiBaseUrl = (): string => {
  const configured = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').trim();
  const withoutTrailingSlash = configured.replace(/\/+$/, '');
  if (/\/api\/v\d+$/.test(withoutTrailingSlash)) {
    return withoutTrailingSlash;
  }
  return `${withoutTrailingSlash}/api/v1`;
};

export const API_BASE_URL = resolveApiBaseUrl();

export const authApiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * The access token lives in this module closure and nowhere else.
 *
 * Never localStorage or sessionStorage: anything readable from JavaScript is
 * readable by any script that gets injected into the page. Losing it on reload
 * is the intended trade — the HttpOnly refresh cookie is what restores the
 * session, and the browser never lets script near it.
 */
let accessTokenInMemory: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessTokenInMemory = token;
};

export const getAccessToken = () => accessTokenInMemory;

/**
 * Endpoints that must never trigger the refresh-on-401 interceptor.
 *
 * Refreshing in response to a failed refresh is an infinite loop, and refreshing
 * in response to a failed login turns a wrong password into a spurious session
 * request. Logout is here because a 401 there already means the session is gone.
 */
const NO_REFRESH_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout', '/auth/register'];

const skipsRefresh = (url?: string): boolean =>
  !!url && NO_REFRESH_PATHS.some((path) => url.includes(path));

/**
 * A bare client for the refresh call itself, deliberately without the
 * interceptors below. Sharing the instrumented client would let a failing
 * refresh re-enter the interceptor that called it.
 *
 * Exported so tests can install an adapter on it; nothing in the app should
 * call it directly — use refreshAccessToken().
 */
export const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * The in-flight refresh, if there is one.
 *
 * Every caller that needs a fresh access token awaits this same promise, so N
 * simultaneous 401s produce exactly one POST /auth/refresh. That matters beyond
 * efficiency: refresh tokens rotate, so a second concurrent refresh presents a
 * token the first one has already spent, and the server has to decide whether it
 * is looking at a race or a stolen token.
 */
let inFlightRefresh: Promise<string> | null = null;

const performRefresh = async (): Promise<string> => {
  try {
    const { data } = await refreshClient.post('/auth/refresh', {});
    const token = data?.accessToken as string | undefined;
    if (!token) {
      throw new Error('Refresh response carried no access token');
    }
    setAccessToken(token);
    return token;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      // Another tab rotated the cookie first. Ours is stale but the session is
      // very much alive, so retry once with the cookie that request set rather
      // than reporting the user as signed out.
      const { data } = await refreshClient.post('/auth/refresh', {});
      const token = data?.accessToken as string | undefined;
      if (!token) {
        throw new Error('Refresh retry carried no access token');
      }
      setAccessToken(token);
      return token;
    }
    setAccessToken(null);
    throw error;
  }
};

/**
 * Exchanges the HttpOnly refresh cookie for a new access token, collapsing
 * concurrent callers onto one request.
 */
export const refreshAccessToken = (): Promise<string> => {
  if (!inFlightRefresh) {
    inFlightRefresh = performRefresh().finally(() => {
      inFlightRefresh = null;
    });
  }
  return inFlightRefresh;
};

/**
 * True when the failure means "this browser has no valid session", as opposed to
 * "the request did not get through". A throttled or unreachable API must not be
 * reported as a signed-out user: that is what turns a transient blip into an
 * unexpected logout.
 */
export const isAuthenticationFailure = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === 401 || status === 403;
};

// Generate unique client-side request IDs for tracing & correlation
const generateRequestId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// Request interceptor: attach bearer access token and correlation headers
authApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (config.headers) {
      if (accessTokenInMemory) {
        config.headers.Authorization = `Bearer ${accessTokenInMemory}`;
      }
      if (!config.headers['X-Request-ID']) {
        config.headers['X-Request-ID'] = generateRequestId();
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor: exchange the refresh cookie for a new access token when
 * a call comes back 401, then replay that call exactly once.
 *
 * The previous implementation kept its own `isRefreshing` flag and a queue of
 * pending resolvers. It worked, but it was a second copy of the single-flight
 * logic — and the bootstrap path in AuthContext had a third, so a page load
 * could issue two refreshes with the same cookie and race its own rotation.
 * Everything now funnels through refreshAccessToken().
 *
 * `_retry` is set before the replay, so a request whose replay also comes back
 * 401 is rejected rather than refreshed again. That is what bounds this: a
 * request can cost at most one refresh, and a refresh can never trigger another.
 */
authApiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      skipsRefresh(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const token = await refreshAccessToken();
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${token}`;
      }
      return authApiClient(originalRequest);
    } catch (refreshErr) {
      // The session could not be restored. Surface the original 401 rather than
      // the refresh failure: the caller asked about its own request, and the
      // context's bootstrap is what decides whether the user is signed out.
      return Promise.reject(refreshErr);
    }
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
  /**
   * The workspaces this account may enter, resolved server-side on every
   * bootstrap. Optional on the type because a client can be pointed at an older
   * backend; absent is treated the same as an incomplete answer.
   */
  workspaces?: Workspace[];
  /**
   * Whether `workspaces` is the whole answer. False means resolution failed and
   * the server degraded the list to the professional workspace alone - so an
   * absent company means "we could not tell", not "you were removed".
   */
  workspacesComplete?: boolean;
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

  /**
   * Ends the session on the server and locally.
   *
   * The in-memory token is cleared in `finally` so a failed request still leaves
   * this tab signed out — but the caller is told the request failed, because a
   * logout whose revocation did not land leaves the session alive on the server
   * and the user should know to try again rather than walk away from a shared
   * machine believing they are signed out.
   */
  async logout() {
    try {
      await authApiClient.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
  },

  /**
   * Restores the session from the HttpOnly refresh cookie. Shares the same
   * in-flight request as the 401 interceptor, so a page load that bootstraps
   * while an API call is already retrying spends one refresh token, not two.
   */
  async refresh() {
    const accessToken = await refreshAccessToken();
    return { accessToken };
  },

  async verifyEmail(token: string) {
    const res = await authApiClient.post('/auth/verify-email', { token });
    return res.data;
  },

  async resendVerification(email: string) {
    const res = await authApiClient.post('/auth/resend-verification', { email });
    return res.data;
  },

  async forgotPassword(email: string) {
    const res = await authApiClient.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(payload: { token: string; password?: string; new_password?: string; newPassword?: string }) {
    const res = await authApiClient.post('/auth/reset-password', payload);
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

export interface ParsedApiError {
  message: string;
  code?: string;
  requestId?: string;
  status?: number;
}

export const extractApiError = (err: unknown, fallbackMessage = 'An unexpected error occurred. Please try again.'): ParsedApiError => {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as any;

    const message = data?.error || data?.message || (status === 429 ? 'Too many requests. Please wait a moment and try again.' : fallbackMessage);
    const code = data?.code;
    const requestId = data?.request_id || err.response?.headers?.['x-request-id'];

    return { message, code, requestId, status };
  }

  if (err instanceof Error) {
    return { message: err.message || fallbackMessage };
  }

  return { message: fallbackMessage };
};

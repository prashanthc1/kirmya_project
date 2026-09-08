import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AxiosRequestConfig } from 'axios';

import {
  authApiClient,
  refreshClient,
  setAccessToken,
  getAccessToken,
  refreshAccessToken,
} from '../services/authService';
import { AuthProvider, useAuthContext } from '../context/AuthContext';

/**
 * These cover the acceptance criterion from the browser's side: on reload the
 * app has no access token and only an HttpOnly cookie it cannot see, so it must
 * call POST /auth/refresh, take the new token and restore the user — without
 * ever reading or writing a token in localStorage.
 */

type Recorded = { url: string; method: string };

let calls: Recorded[] = [];
let handlers: Record<string, () => { status: number; data?: any }>;

/**
 * A stand-in transport for both axios instances. The suite's global setup
 * rejects all network access, so each client gets an adapter that answers from
 * `handlers` and records what was asked for.
 */
const installAdapter = () => {
  const adapter = async (config: AxiosRequestConfig) => {
    const url = `${config.url}`;
    calls.push({ url, method: (config.method || 'get').toLowerCase() });

    const handler = handlers[url];
    const { status, data } = handler ? handler() : { status: 404, data: {} };

    if (status >= 400) {
      const error: any = new Error(`Request failed with status code ${status}`);
      error.isAxiosError = true;
      error.config = config;
      error.response = { status, data, headers: {}, config };
      throw error;
    }
    return { status, data, statusText: 'OK', headers: {}, config };
  };

  authApiClient.defaults.adapter = adapter as any;
  refreshClient.defaults.adapter = adapter as any;
};

const refreshCallCount = () => calls.filter((c) => c.url === '/auth/refresh').length;

const profile = {
  user: {
    id: 'user-1',
    uuid: 'uuid-1',
    firstName: 'Session',
    lastName: 'Subject',
    email: 'session@kirmya.test',
    emailVerified: true,
    roleId: 'candidate',
    status: 'active',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  permissions: ['jobs:apply'],
  notificationsCount: 2,
};

const authenticatedSession = () => {
  handlers['/auth/refresh'] = () => ({ status: 200, data: { accessToken: 'fresh-access-token' } });
  handlers['/auth/me'] = () => ({ status: 200, data: profile });
};

const noSession = () => {
  handlers['/auth/refresh'] = () => ({ status: 401, data: { error: 'Missing refresh token cookie' } });
  handlers['/auth/me'] = () => ({ status: 401, data: { error: 'Unauthorized' } });
};

beforeEach(() => {
  calls = [];
  handlers = {};
  setAccessToken(null);
  installAdapter();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

/** Renders the provider and surfaces the state the guards branch on. */
const Probe = () => {
  const { status, user, permissions, logout } = useAuthContext();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="email">{user?.email ?? 'none'}</span>
      <span data-testid="permissions">{permissions.join(',')}</span>
      <button type="button" onClick={() => void logout()}>
        Sign out
      </button>
    </div>
  );
};

const renderProvider = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Probe />
        </AuthProvider>
      </QueryClientProvider>
    ),
  };
};

describe('session restoration on page load', () => {
  it('exchanges the refresh cookie for a token and restores the user', async () => {
    authenticatedSession();

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('email')).toHaveTextContent('session@kirmya.test');
    expect(screen.getByTestId('permissions')).toHaveTextContent('jobs:apply');
    expect(getAccessToken()).toBe('fresh-access-token');
  });

  it('starts in loading, never flashing an unauthenticated state first', async () => {
    authenticatedSession();

    renderProvider();

    // The very first paint must not claim the visitor is signed out: that is
    // what redirects a valid session to the login page on every reload.
    expect(screen.getByTestId('status')).toHaveTextContent('loading');

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
  });

  it('reports unauthenticated when the server says there is no session', async () => {
    noSession();

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
    expect(getAccessToken()).toBeNull();
  });

  it('issues exactly one refresh per page load', async () => {
    authenticatedSession();

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    // Refresh tokens rotate, so a second bootstrap would present a token the
    // first has already spent and race its own rotation.
    expect(refreshCallCount()).toBe(1);
  });

  it('retries once when the refresh fails for a reason other than a dead session', async () => {
    let attempt = 0;
    handlers['/auth/refresh'] = () => {
      attempt += 1;
      // A throttled or briefly unreachable API is not a signed-out user.
      return attempt === 1
        ? { status: 429, data: { error: 'Too many requests' } }
        : { status: 200, data: { accessToken: 'fresh-access-token' } };
    };
    handlers['/auth/me'] = () => ({ status: 200, data: profile });

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'), {
      timeout: 5000,
    });
    expect(refreshCallCount()).toBe(2);
  });

  it('does not retry when the server has definitively rejected the cookie', async () => {
    noSession();

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
    expect(refreshCallCount()).toBe(1);
  });
});

describe('token storage', () => {
  it('never writes a token to localStorage or sessionStorage', async () => {
    authenticatedSession();

    renderProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));

    const stored = [
      ...Object.keys(window.localStorage).map((k) => window.localStorage.getItem(k)),
      ...Object.keys(window.sessionStorage).map((k) => window.sessionStorage.getItem(k)),
    ].join(' ');

    expect(stored).not.toContain('fresh-access-token');
    expect(window.localStorage.getItem('accessToken')).toBeNull();
    expect(window.localStorage.getItem('token')).toBeNull();
    expect(window.sessionStorage.getItem('accessToken')).toBeNull();
  });
});

describe('concurrent 401 handling', () => {
  it('collapses simultaneous 401s onto a single refresh and replays each request once', async () => {
    setAccessToken('expired-token');

    let refreshed = false;
    handlers['/auth/refresh'] = () => {
      refreshed = true;
      return { status: 200, data: { accessToken: 'fresh-access-token' } };
    };
    // Every protected endpoint is 401 until the refresh lands, then 200.
    for (const path of ['/applications', '/jobs/saved', '/notifications']) {
      handlers[path] = () =>
        refreshed ? { status: 200, data: { items: [] } } : { status: 401, data: { error: 'Unauthorized' } };
    }

    const responses = await Promise.all([
      authApiClient.get('/applications'),
      authApiClient.get('/jobs/saved'),
      authApiClient.get('/notifications'),
    ]);

    expect(responses.every((r) => r.status === 200)).toBe(true);
    // Three 401s, one refresh. Two rotations would make the second present a
    // spent token, which the server is entitled to read as a stolen one.
    expect(refreshCallCount()).toBe(1);
    // Each original request was retried exactly once.
    expect(calls.filter((c) => c.url === '/applications').length).toBe(2);
  });

  it('never refreshes recursively when the refresh itself is rejected', async () => {
    setAccessToken('expired-token');
    handlers['/auth/refresh'] = () => ({ status: 401, data: { error: 'invalid or expired session' } });
    handlers['/applications'] = () => ({ status: 401, data: { error: 'Unauthorized' } });

    await expect(authApiClient.get('/applications')).rejects.toBeTruthy();

    // One attempt, not a loop.
    expect(refreshCallCount()).toBe(1);
  });

  it('does not attempt a refresh when a login is rejected', async () => {
    handlers['/auth/login'] = () => ({ status: 401, data: { error: 'invalid email or password' } });

    await expect(
      authApiClient.post('/auth/login', { email: 'a@b.test', password: 'wrong' })
    ).rejects.toBeTruthy();

    expect(refreshCallCount()).toBe(0);
  });

  it('retries once when another tab rotated the cookie first', async () => {
    let attempt = 0;
    handlers['/auth/refresh'] = () => {
      attempt += 1;
      // 409 is the server saying "another request won the rotation race" — the
      // session is alive, this caller just needs to ask again.
      return attempt === 1
        ? { status: 409, data: { error: 'session was just rotated. Please retry' } }
        : { status: 200, data: { accessToken: 'fresh-access-token' } };
    };

    await expect(refreshAccessToken()).resolves.toBe('fresh-access-token');
    expect(refreshCallCount()).toBe(2);
  });
});

describe('signing out', () => {
  it('clears the token, the user and the cached per-user data', async () => {
    authenticatedSession();
    handlers['/auth/logout'] = () => ({ status: 200, data: { message: 'Logged out successfully' } });

    const { queryClient } = renderProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));

    // Something cached under the signed-in user.
    queryClient.setQueryData(['applications'], [{ id: 'application-1' }]);

    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
    expect(getAccessToken()).toBeNull();
    expect(screen.getByTestId('email')).toHaveTextContent('none');
    expect(screen.getByTestId('permissions')).toHaveTextContent('');
    // The next user to sign in on this browser must not see the last one's data.
    expect(queryClient.getQueryData(['applications'])).toBeUndefined();
  });

  it('still signs the tab out when the logout request fails', async () => {
    authenticatedSession();
    handlers['/auth/logout'] = () => ({ status: 500, data: { error: 'Sign-out could not be completed' } });

    renderProvider();
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));

    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('unauthenticated'));
    expect(getAccessToken()).toBeNull();
  });
});

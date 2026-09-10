'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import {
  authService,
  isAuthenticationFailure,
  setAccessToken,
  UserProfile,
  LoginPayload,
  RegisterPayload,
  UserMeResponse,
} from '../services/authService';
import type { Workspace } from '../shared/workspace/types';

/**
 * The three states a session can be in, named rather than inferred.
 *
 * `loading` is not the same as `unauthenticated`, and collapsing them into one
 * boolean is what produces a login-page flash on every reload: the app has not
 * yet asked the server whether there is a session, but a guard reading
 * `!user` decides there is not and redirects. Callers must branch on `status`
 * and treat `loading` as "do not know yet".
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  user: UserProfile | null;
  permissions: string[];
  /**
   * The workspaces this account may enter, as the server resolved them.
   *
   * Navigation data, never authority. Rendering an entry does not grant
   * anything and omitting one does not protect anything: every privileged
   * route refuses an unauthorized caller on the server, whatever this list
   * says. Empty until the first bootstrap settles.
   */
  workspaces: Workspace[];
  /**
   * Whether `workspaces` is the whole answer. False means the server could not
   * resolve them and degraded to the professional workspace, so a missing
   * company means "unknown", not "revoked" - which is why no selection is
   * persisted against an incomplete list.
   */
  workspacesComplete: boolean;
  /**
   * The workspace this account last chose, for use when nothing else says
   * where to go - signing in without a returnUrl, and nowhere else.
   *
   * Never consult this to decide which workspace is active: that follows the
   * URL, through activeWorkspace(). This answers the different question of
   * where to land when there is no URL yet, and it is null far more often than
   * not - the server withholds it unless it still names one of `workspaces`.
   */
  lastWorkspaceKey: string | null;
  notificationsCount: number;
  setNotificationsCount: React.Dispatch<React.SetStateAction<number>>;
  status: AuthStatus;
  /** True until the first bootstrap attempt has settled. */
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

/**
 * The React Query client, when there is one.
 *
 * AuthProvider clears cached per-user data on sign-in and sign-out, which needs
 * the client — but it must not hard-require one. `useQueryClient` throws when no
 * provider is above it, which would turn "this tree has no query client" into a
 * crash of the whole app shell rather than the loss of one cache sweep. The
 * hook is still called unconditionally, so hook order is unaffected.
 */
const useOptionalQueryClient = (): QueryClient | null => {
  try {
    return useQueryClient();
  } catch {
    return null;
  }
};

/** Signals other tabs that this one signed in or out. Carries no token. */
const AUTH_BROADCAST_CHANNEL = 'kirmya-auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useOptionalQueryClient();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspacesComplete, setWorkspacesComplete] = useState(false);
  const [lastWorkspaceKey, setLastWorkspaceKey] = useState<string | null>(null);
  const [notificationsCount, setNotificationsCount] = useState<number>(0);
  const [status, setStatus] = useState<AuthStatus>('loading');

  /**
   * Guards the bootstrap against running twice.
   *
   * React 18 mounts effects twice in development StrictMode, and each run would
   * POST /auth/refresh with the same cookie. Refresh tokens rotate, so the
   * second call presents a token the first has already spent — the server sees
   * a replay and the page load races itself. One bootstrap per mount.
   */
  const bootstrapped = useRef(false);

  const applyIdentity = useCallback(
    (me: {
      user: UserProfile;
      permissions?: string[];
      notificationsCount?: number;
      workspaces?: Workspace[];
      workspacesComplete?: boolean;
      lastWorkspaceKey?: string;
    }) => {
      setUser(me.user);
      setPermissions(me.permissions || []);
      setNotificationsCount(me.notificationsCount || 0);
      // An older backend serves no workspaces at all. That is indistinguishable
      // from a degraded answer and is treated as one: an empty list is never
      // reported as complete, so nothing reads it as "this account has none".
      setWorkspaces(me.workspaces || []);
      setWorkspacesComplete(Boolean(me.workspacesComplete) && Array.isArray(me.workspaces));
      // The server has already checked this against the list it served beside
      // it, and withholds it otherwise. Checking again here would be a second
      // implementation of the same rule; taking it as-is and finding no
      // matching workspace simply means no landing hint, which is the same
      // outcome.
      setLastWorkspaceKey(me.lastWorkspaceKey || null);
      setStatus('authenticated');
    },
    []
  );

  const clearIdentity = useCallback(() => {
    setUser(null);
    setPermissions([]);
    setNotificationsCount(0);
    setWorkspaces([]);
    setWorkspacesComplete(false);
    setLastWorkspaceKey(null);
    setStatus('unauthenticated');
  }, []);

  /**
   * Restores the session on page load: exchange the HttpOnly refresh cookie for
   * an access token, then read the identity behind it.
   *
   * A failure that is not a 401 or 403 — a throttled API, a network blip, a
   * deploy in progress — is retried once before giving up. Treating every
   * failure as "signed out" is how a five-second outage became an unexplained
   * logout for everyone who reloaded during it.
   */
  const bootstrap = useCallback(async () => {
    setStatus('loading');

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await authService.refresh();
        applyIdentity(await authService.getMe());
        return;
      } catch (error) {
        if (isAuthenticationFailure(error)) {
          // The server is certain: there is no session behind this cookie.
          clearIdentity();
          return;
        }
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 750));
          continue;
        }
        // Out of retries. There is no usable session in this tab either way, so
        // the guards must not hold the user on a spinner forever.
        clearIdentity();
      }
    }
  }, [applyIdentity, clearIdentity]);

  const refreshAuth = useCallback(async () => {
    await bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    void bootstrap();
  }, [bootstrap]);

  /**
   * Keeps other tabs in step. Signing out in one tab must not leave another
   * showing a signed-in shell whose every request now fails.
   */
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return undefined;

    const channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
    channel.onmessage = (event) => {
      if (event.data === 'signed-out') {
        setAccessToken(null);
        queryClient?.clear();
        clearIdentity();
      } else if (event.data === 'signed-in') {
        void bootstrap();
      }
    };
    return () => channel.close();
  }, [bootstrap, clearIdentity, queryClient]);

  const announce = useCallback((message: 'signed-in' | 'signed-out') => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
    channel.postMessage(message);
    channel.close();
  }, []);

  const login = async (payload: LoginPayload) => {
    setStatus('loading');
    try {
      const data = await authService.login(payload);
      // Any data cached for a previous user must not survive into this session.
      queryClient?.clear();

      // Returned to the caller as well as applied to state. A caller deciding
      // where to send the user immediately after signing in cannot read that
      // state yet - it belongs to a render that has not happened - and a second
      // /auth/me call to work around it would ask a question already answered.
      let identity: UserMeResponse | null = null;
      try {
        identity = await authService.getMe();
        applyIdentity(identity);
      } catch {
        // The login itself succeeded, so the session exists. Fall back to the
        // profile the login response carried rather than reporting a failure.
        setUser(data.user);
        setStatus('authenticated');
      }
      announce('signed-in');
      return { ...data, identity };
    } catch (error) {
      clearIdentity();
      throw error;
    }
  };

  const register = async (payload: RegisterPayload) => {
    return await authService.register(payload);
  };

  /**
   * Signs out. Always resolves.
   *
   * The local half — token, cached per-user data, context, other tabs — happens
   * whatever the server said, so the tab is signed out either way. The server
   * half can fail, and that failure is logged rather than thrown: both call
   * sites `await logout()` and then navigate, so rejecting here skipped the
   * navigation, showed the user nothing, and left an unhandled rejection in the
   * console. The backend records a failed revocation with full detail; this side
   * needs to finish signing the person out.
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Sign-out could not be confirmed by the server', error);
    } finally {
      setAccessToken(null);
      queryClient?.clear();
      clearIdentity();
      announce('signed-out');
    }
  };

  const verifyEmail = async (token: string) => {
    return await authService.verifyEmail(token);
  };

  const resendVerification = async (email: string) => {
    return await authService.resendVerification(email);
  };

  const isAuthed = status === 'authenticated' && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        workspaces,
        workspacesComplete,
        lastWorkspaceKey,
        notificationsCount,
        setNotificationsCount,
        status,
        loading: status === 'loading',
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

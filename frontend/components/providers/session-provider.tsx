"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "@/lib/api";
import type { SessionResponse } from "@/lib/types";

type SessionContextValue = {
  session: SessionResponse | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  login: () => void;
  isAuthenticated: boolean;
};

const SessionContext = createContext<SessionContextValue | null>(null);

const EMPTY_SESSION: SessionResponse = {
  authenticated: false,
  user: null,
  connectedAccounts: [],
};

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await authApi.getSession();
      setSession(response);
      setError(null);
    } catch (err) {
      setSession(EMPTY_SESSION);
      setError(
        err instanceof Error
          ? err.message
          : "Could not reach the backend to verify your session.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (_error) {
      // The session cookie is cleared locally even when the request fails.
    } finally {
      await refresh();
    }
  }, [refresh]);

  const login = useCallback(() => {
    authApi.loginWithGoogle();
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      session,
      loading,
      error,
      refresh,
      logout,
      login,
      isAuthenticated: Boolean(session?.authenticated),
    }),
    [session, loading, error, refresh, logout, login],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside SessionProvider");
  }

  return context;
}

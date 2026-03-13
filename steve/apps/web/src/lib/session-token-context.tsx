"use client";

import {
  clearSessionToken as clearStoredSessionToken,
  getSessionToken,
  persistSessionToken as persistStoredSessionToken,
} from "@/lib/auth-session";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createSessionTokenStore } from "./sessionTokenStore";

const sessionTokenStore = createSessionTokenStore(getSessionToken);

type SessionTokenContextValue = {
  sessionToken: string | null;
  sessionReady: boolean;
  persistSessionToken: (token: string) => void;
  clearSessionToken: () => void;
  refreshSessionToken: () => string | null;
};

const SessionTokenContext = createContext<SessionTokenContextValue | null>(null);

export function SessionTokenProvider({
  children,
  initialSessionToken,
}: {
  children: ReactNode;
  initialSessionToken: string | null;
}) {
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    sessionTokenStore.set(initialSessionToken);
    return initialSessionToken;
  });
  const [sessionReady, setSessionReady] = useState(initialSessionToken !== null);

  useEffect(() => {
    if (sessionToken) {
      setSessionReady(true);
      return;
    }

    const nextToken = sessionTokenStore.refresh();
    if (nextToken) {
      setSessionToken(nextToken);
    }
    setSessionReady(true);
  }, [sessionToken]);

  const value = useMemo<SessionTokenContextValue>(
    () => ({
      sessionToken,
      sessionReady,
      persistSessionToken(token: string) {
        persistStoredSessionToken(token);
        sessionTokenStore.set(token);
        setSessionToken(token);
        setSessionReady(true);
      },
      clearSessionToken() {
        clearStoredSessionToken();
        sessionTokenStore.clear();
        setSessionToken(null);
        setSessionReady(true);
      },
      refreshSessionToken() {
        const nextToken = sessionTokenStore.refresh();
        setSessionToken(nextToken);
        setSessionReady(true);
        return nextToken;
      },
    }),
    [sessionReady, sessionToken],
  );

  return (
    <SessionTokenContext.Provider value={value}>
      {children}
    </SessionTokenContext.Provider>
  );
}

export function useSessionToken() {
  const context = useContext(SessionTokenContext);

  if (!context) {
    throw new Error("useSessionToken must be used within SessionTokenProvider");
  }

  return context;
}

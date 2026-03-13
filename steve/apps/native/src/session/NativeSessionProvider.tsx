import React, { createContext, startTransition, useContext, useEffect, useState } from "react";
import { useConvex } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import {
  clearNativeSessionToken,
  loadNativeSessionToken,
  saveNativeSessionToken,
} from "./nativeSessionStorage";

type NativeSessionContextValue = {
  isAuthenticated: boolean;
  hasProfile: boolean;
  sessionReady: boolean;
  sessionToken: string | null;
  signInWithPhone: (phone: string, password: string) => Promise<{ hasProfile: boolean }>;
  registerWithPhone: (input: {
    phone: string;
    password: string;
    confirmPassword: string;
    inviteCode: string;
  }) => Promise<{ hasProfile: boolean }>;
  markProfileCompleted: () => void;
  signOut: () => Promise<void>;
};

const NativeSessionContext = createContext<NativeSessionContextValue | null>(null);

export function NativeSessionProvider({ children }: { children: React.ReactNode }) {
  const convex = useConvex();
  const [sessionReady, setSessionReady] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const nextSessionToken = await loadNativeSessionToken();
      if (!nextSessionToken) {
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setHasProfile(false);
          setSessionToken(null);
          setSessionReady(true);
        });
        return;
      }

      try {
        const me = await convex.query(api.auth.me, { sessionToken: nextSessionToken });
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setHasProfile(me.hasProfile);
          setSessionToken(nextSessionToken);
          setSessionReady(true);
        });
      } catch {
        await clearNativeSessionToken();
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setHasProfile(false);
          setSessionToken(null);
          setSessionReady(true);
        });
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [convex]);

  async function signInWithPhone(phone: string, password: string) {
    const result = await convex.mutation(api.auth.loginWithPhone, {
      phone,
      password,
    });

    await saveNativeSessionToken(result.sessionToken);
    startTransition(() => {
      setHasProfile(result.hasProfile);
      setSessionToken(result.sessionToken);
      setSessionReady(true);
    });

    return {
      hasProfile: result.hasProfile,
    };
  }

  async function registerWithPhone(input: {
    phone: string;
    password: string;
    confirmPassword: string;
    inviteCode: string;
  }) {
    const result = await convex.mutation(api.auth.registerWithPhone, input);

    await saveNativeSessionToken(result.sessionToken);
    startTransition(() => {
      setHasProfile(result.hasProfile);
      setSessionToken(result.sessionToken);
      setSessionReady(true);
    });

    return {
      hasProfile: result.hasProfile,
    };
  }

  function markProfileCompleted() {
    startTransition(() => {
      setHasProfile(true);
    });
  }

  async function signOut() {
    await clearNativeSessionToken();
    startTransition(() => {
      setHasProfile(false);
      setSessionToken(null);
      setSessionReady(true);
    });
  }

  return (
    <NativeSessionContext.Provider
      value={{
        isAuthenticated: Boolean(sessionToken),
        hasProfile,
        sessionReady,
        sessionToken,
        signInWithPhone,
        registerWithPhone,
        markProfileCompleted,
        signOut,
      }}
    >
      {children}
    </NativeSessionContext.Provider>
  );
}

export function useNativeSession() {
  const context = useContext(NativeSessionContext);
  if (!context) {
    throw new Error("useNativeSession must be used within NativeSessionProvider");
  }

  return context;
}

"use client";

import AppShell from "@/components/app-shell/AppShell";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { resolvePostAuthPath } from "@/lib/authRedirects";
import { useI18n } from "@/lib/i18n";
import { useSessionToken } from "@/lib/session-token-context";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation } from "convex/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

type AuthMode = "login" | "register";
type LoginScreenProps = {
  initialMode?: AuthMode;
  initialInviteCode?: string;
};

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = (error as { data?: unknown }).data;
    if (typeof data === "string" && data.trim()) return data;
    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof (data as { message?: unknown }).message === "string"
    ) {
      return (data as { message: string }).message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export default function LoginScreen({ initialMode, initialInviteCode }: LoginScreenProps) {
  const { t } = useI18n();
  const router = useRouter();
  const { clearSessionToken, persistSessionToken } = useSessionToken();

  // Clear any existing session when landing on login page
  useEffect(() => {
    clearSessionToken();
  }, []);
  const loginWithPhone = useMutation(api.auth.loginWithPhone);
  const registerWithPhone = useMutation(api.auth.registerWithPhone);
  const validateInvitationCode = useMutation(api.invitationCodes.validateInvitationCode);

  const [mode, setMode] = useState<AuthMode>("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [validatingInvite, setValidatingInvite] = useState(false);

  // Apply URL-derived auth mode/invite passed from the page component.
  useEffect(() => {
    if (initialMode === "register") {
      setMode("register");
    }
    if (initialInviteCode) {
      setInviteCode(initialInviteCode.toUpperCase());
      setMode("register");
    }
  }, [initialInviteCode, initialMode]);

  const isRegister = mode === "register";

  // Validate invitation code when registering
  useEffect(() => {
    if (!isRegister || !inviteCode) {
      return;
    }

    async function validate() {
      setValidatingInvite(true);
      try {
        const result = await validateInvitationCode({ code: inviteCode });
        if (!result.valid) {
          setError(result.error || t.invitation.invalidCode);
        } else {
          setError("");
        }
      } catch (e) {
        console.error("Failed to validate invite code:", e);
      } finally {
        setValidatingInvite(false);
      }
    }

    validate();
  }, [inviteCode, isRegister, validateInvitationCode, t]);

  const canSubmit = useMemo(() => {
    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.length !== 11) return false;
    if (password.trim().length < 6) return false;
    if (isRegister && !confirmPassword.trim()) return false;
    if (isRegister && inviteCode.trim().length !== 6) return false;
    return true;
  }, [confirmPassword, inviteCode, isRegister, password, phone]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || submitting) return;

    const normalizedPhone = normalizePhone(phone);
    setError("");
    setSubmitting(true);

    try {
      if (isRegister && password !== confirmPassword) {
        throw new Error(t.login.passwordsNotMatch);
      }

      const result = isRegister
        ? await registerWithPhone({
            phone: normalizedPhone,
            password,
            confirmPassword,
            inviteCode: inviteCode.trim().toUpperCase(),
          })
        : await loginWithPhone({
            phone: normalizedPhone,
            password,
          });

      persistSessionToken(result.sessionToken);
      router.push(resolvePostAuthPath(result.hasProfile));
    } catch (unknownError) {
      const message = getErrorMessage(unknownError, t.login.loginFailed);
      if (!isRegister && message.toLowerCase().includes("not registered")) {
        setMode("register");
      }
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell withBottomNav={false}>
      <div className="flex h-full min-h-0 flex-col bg-white px-6">
        <div className="pt-20 pb-10">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-5xl font-bold text-black">{t.login.title}</h1>
              <p className="mt-3 text-sm text-gray-500">{t.login.subtitle}</p>
            </div>
            <LanguageSwitcher variant="minimal" className="mt-2" />
          </div>
        </div>

        <div className="mb-6 rounded-xl bg-gray-100 p-1 flex gap-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              mode === "login" ? "bg-white text-black shadow-sm" : "text-gray-500"
            }`}
          >
            {t.login.loginTab}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              mode === "register" ? "bg-white text-black shadow-sm" : "text-gray-500"
            }`}
          >
            {t.login.registerTab}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <div className="space-y-4">
            <div>
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder={t.login.phonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-4 bg-white border-b border-gray-200 text-black placeholder-gray-400 outline-none focus:border-black transition-colors"
              />
            </div>

            <div>
              <input
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                placeholder={t.login.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 bg-white border-b border-gray-200 text-black placeholder-gray-400 outline-none focus:border-black transition-colors"
              />
            </div>

            {isRegister ? (
              <>
                <div>
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder={t.login.confirmPasswordPlaceholder}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-4 bg-white border-b border-gray-200 text-black placeholder-gray-400 outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder={t.invitation.invitePlaceholder}
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="w-full px-4 py-4 bg-white border-b border-gray-200 text-black placeholder-gray-400 outline-none focus:border-black transition-colors font-mono uppercase"
                    maxLength={6}
                  />
                </div>
              </>
            ) : null}
          </div>

          <div className="mt-auto pb-12 pt-8">
            {error ? <p className="mb-3 text-sm text-red-500">{error}</p> : null}
            <button
              type="submit"
              className="w-full py-4 bg-black text-white font-medium rounded-xl mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!canSubmit || submitting || (isRegister && validatingInvite)}
            >
              {submitting || validatingInvite ? t.common.loading : isRegister ? t.login.registerButton : t.login.loginButton}
            </button>
            <p className="text-center text-xs text-gray-400 leading-relaxed">
              {isRegister ? t.login.registerHint : t.login.loginHint}
            </p>
            <div className="mt-6 text-center">
              <Link href="/login" className="text-xs text-gray-500 underline">
                {t.login.stayOnLogin}
              </Link>
            </div>
          </div>
        </form>
      </div>
    </AppShell>
  );
}

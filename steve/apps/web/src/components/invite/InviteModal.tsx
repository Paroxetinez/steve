"use client";

import { useI18n } from "@/lib/i18n";
import { useSessionToken } from "@/lib/session-token-context";
import { api } from "@packages/backend/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Copy, RefreshCw, Share2, X } from "lucide-react";
import { useMemo, useState } from "react";

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const JOE_PHONE = "18106289189";

export function InviteModal({ isOpen, onClose }: InviteModalProps) {
  const { t, language } = useI18n();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const { sessionToken } = useSessionToken();
  const generateInvitationCodes = useMutation(api.invitationCodes.generateInvitationCodes);
  const me = useQuery(api.auth.me, sessionToken ? { sessionToken } : "skip");
  const myInvitationCodes = useQuery(
    api.invitationCodes.getMyInvitationCodes,
    sessionToken ? { sessionToken } : "skip",
  );

  const isJoe = me?.phone === JOE_PHONE;
  const codes = myInvitationCodes ?? [];
  const maxCodes = 5;
  const nonJoeReachedLimit = !isJoe && codes.length >= maxCodes;
  const generateDisabled = generating || nonJoeReachedLimit;

  const sortedCodes = useMemo(() => {
    return [...codes].sort((a, b) => b.createdAt - a.createdAt);
  }, [codes]);

  async function handleGenerate() {
    if (!sessionToken || generateDisabled) return;

    setGenerating(true);
    try {
      await generateInvitationCodes({ sessionToken, count: maxCodes });
    } catch (error) {
      console.error("Failed to generate codes:", error);
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy(code: string) {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative mx-4 max-h-[80vh] w-full max-w-md overflow-hidden rounded-2xl bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-black">{t.invitation.inviteFriend}</h2>
          <button onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-gray-100">
            <X className="size-5 text-gray-500" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          <button
            onClick={handleGenerate}
            disabled={generateDisabled}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-black py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {generating ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                {t.invitation.generating}
              </>
            ) : (
              <>
                <Share2 className="size-4" />
                {nonJoeReachedLimit
                  ? language === "zh"
                    ? "邀请码已满 5 个"
                    : "You already have 5 codes"
                  : t.invitation.generateCodes}
              </>
            )}
          </button>

          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-500">{t.invitation.myCodes}</h3>
            <span className="text-xs text-gray-400">
              {Math.min(codes.length, maxCodes)}/{maxCodes}
            </span>
          </div>

          <div className="space-y-2">
            {sortedCodes.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3"
              >
                <span className="font-mono text-lg font-bold tracking-wider text-black">{item.code}</span>
                {!item.usedAt ? (
                  <button
                    onClick={() => void handleCopy(item.code)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
                  >
                    {copiedCode === item.code ? (
                      <span className="text-green-600">{t.invitation.copied}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5">
                        <Copy className="size-3.5 text-gray-500" />
                        {language === "zh" ? "复制" : "Copy"}
                      </span>
                    )}
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">{t.invitation.used}</span>
                )}
              </div>
            ))}

            {sortedCodes.length === 0 ? (
              <p className="py-4 text-center text-sm text-gray-400">
                {language === "zh" ? "点击上方按钮生成 5 个邀请码" : "Click above to generate 5 codes"}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

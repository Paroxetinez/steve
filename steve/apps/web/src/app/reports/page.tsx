"use client";

import AppShell from "@/components/app-shell/AppShell";
import { useI18n } from "@/lib/i18n";
import { useSessionToken } from "@/lib/session-token-context";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function formatRelativeTime(timestamp: number, language: string) {
  const diffMs = Date.now() - timestamp;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${Math.max(minutes, 1)}${language === "zh" ? "分钟前" : "m ago"}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}${language === "zh" ? "小时前" : "h ago"}`;
  const days = Math.floor(hours / 24);
  return `${days}${language === "zh" ? "天前" : "d ago"}`;
}

function getReportTagLabel(tag: string, language: string) {
  if (tag === "milestone_offline_meetup") {
    return language === "zh" ? "奔现捷报" : "Offline Meetup";
  }
  if (tag === "milestone_crisis_resolved") {
    return language === "zh" ? "危机解除" : "Crisis Resolved";
  }
  if (tag === "milestone_relationship_warming") {
    return language === "zh" ? "关系升温" : "Relationship Warming";
  }
  return language === "zh" ? "里程碑" : "Milestone";
}

export default function ReportsPage() {
  const { t, language } = useI18n();
  const router = useRouter();
  const { sessionToken, sessionReady } = useSessionToken();

  useEffect(() => {
    if (sessionReady && !sessionToken) {
      router.replace("/login");
    }
  }, [router, sessionReady, sessionToken]);

  const report = useQuery(
    api.chatConversations.getMyReport,
    sessionToken ? { sessionToken } : "skip",
  );

  return (
    <AppShell>
      <div className="flex h-full min-h-0 flex-col bg-white">
        <div className="px-6 pt-12 pb-6 flex items-center justify-center relative">
          <button onClick={() => router.push("/personal-profile")} className="absolute left-6">
            <ChevronLeft className="size-6 text-black" strokeWidth={2} />
          </button>
          <h1 className="font-semibold text-black">{t.reports.title}</h1>
        </div>

        <div className="px-6 py-8">
          <div className="flex items-center justify-around">
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold text-black mb-2">
                {report?.stats.totalAssists ?? 0}
              </div>
              <div className="text-sm text-gray-500">{t.reports.totalAssists}</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold text-black mb-2">
                {report?.stats.icebreaks ?? 0}
              </div>
              <div className="text-sm text-gray-500">{t.reports.icebreaks}</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold text-black mb-2">
                {report?.stats.offlineMeetups ?? 0}
              </div>
              <div className="text-sm text-gray-500">{t.reports.offlineMeetups}</div>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
          <h2 className="text-sm text-gray-400 mb-4">{t.reports.highlightsTitle}</h2>
          <div className="space-y-4">
            {(report?.highlights ?? []).map((item) => (
              <Link
                key={item.conversationId}
                href={`/chat?conversationId=${item.conversationId}`}
                className="w-full bg-white rounded-2xl p-5 text-left hover:bg-gray-50 transition-colors block"
                style={{ boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="font-semibold text-black">{item.title}</span>
                  <span className="px-3 py-1 bg-black text-white text-xs rounded-full">
                    {getReportTagLabel(item.tag, language)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3 leading-relaxed">{item.preview}</p>
                <span className="text-xs text-gray-400">{formatRelativeTime(item.updatedAt, language)}</span>
              </Link>
            ))}

            {report && report.highlights.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                {t.reports.noHighlights}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

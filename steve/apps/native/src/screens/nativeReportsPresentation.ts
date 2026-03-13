import type { NativeAppLanguage } from "../preferences/nativePreferencesStorage";

export function formatNativeReportRelativeTime(input: {
  language: NativeAppLanguage;
  now?: number;
  timestamp: number;
}) {
  const now = input.now ?? Date.now();
  const diffMs = Math.max(0, now - input.timestamp);
  const minutes = Math.max(1, Math.floor(diffMs / 60_000));

  if (minutes < 60) {
    return input.language === "zh" ? `${minutes}分钟前` : `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return input.language === "zh" ? `${hours}小时前` : `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return input.language === "zh" ? `${days}天前` : `${days}d ago`;
}

export function getNativeReportTagLabel(input: {
  language: NativeAppLanguage;
  tag: string;
}) {
  if (input.tag === "milestone_offline_meetup") {
    return input.language === "zh" ? "奔现捷报" : "Offline Meetup";
  }
  if (input.tag === "milestone_crisis_resolved") {
    return input.language === "zh" ? "危机解除" : "Crisis Resolved";
  }
  if (input.tag === "milestone_relationship_warming") {
    return input.language === "zh" ? "关系升温" : "Relationship Warming";
  }
  return input.language === "zh" ? "里程碑" : "Milestone";
}

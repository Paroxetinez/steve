import type { Language } from "./i18n/translations";

type FormatMessageTimeArgs = {
  timestamp: number;
  now?: number;
  language: Language;
  timeZone?: string;
};

const ZH_WEEKDAY_LABELS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"] as const;
const EN_MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function resolveTimeZone(timeZone?: string) {
  return timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getZonedDateParts(timestamp: number, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date(timestamp));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: get("hour"),
    minute: get("minute"),
  };
}

function getDayIndex(parts: { year: number; month: number; day: number }) {
  return Math.floor(Date.UTC(parts.year, parts.month - 1, parts.day) / 86_400_000);
}

function getDayDiff(timestamp: number, now: number, timeZone: string) {
  const target = getZonedDateParts(timestamp, timeZone);
  const current = getZonedDateParts(now, timeZone);
  return {
    target,
    current,
    dayDiff: getDayIndex(current) - getDayIndex(target),
  };
}

function formatTime(parts: { hour: string; minute: string }) {
  return `${parts.hour}:${parts.minute}`;
}

function formatChineseMonthDay(parts: { month: number; day: number }) {
  return `${parts.month}月${parts.day}日`;
}

function formatChineseFullDate(parts: { year: number; month: number; day: number }) {
  return `${parts.year}年${parts.month}月${parts.day}日`;
}

function formatEnglishMonthDay(parts: { month: number; day: number }) {
  return `${parts.day} ${EN_MONTH_LABELS[parts.month - 1]}`;
}

function formatEnglishFullDate(parts: { year: number; month: number; day: number }) {
  return `${parts.day} ${EN_MONTH_LABELS[parts.month - 1]} ${parts.year}`;
}

function formatEnglishShortDate(parts: { year: number; month: number; day: number }) {
  return `${parts.month}/${parts.day}/${String(parts.year).slice(-2)}`;
}

export function formatChatMessageTime({
  timestamp,
  now = Date.now(),
  language,
  timeZone,
}: FormatMessageTimeArgs) {
  const resolvedTimeZone = resolveTimeZone(timeZone);
  const { target, current, dayDiff } = getDayDiff(timestamp, now, resolvedTimeZone);

  if (dayDiff <= 0) {
    return formatTime(target);
  }

  if (dayDiff === 1) {
    return `${language === "zh" ? "昨天" : "Yesterday"} ${formatTime(target)}`;
  }

  if (language === "zh" && dayDiff < 7) {
    const weekdayIndex = new Date(
      Date.UTC(target.year, target.month - 1, target.day),
    ).getUTCDay();
    return `${ZH_WEEKDAY_LABELS[weekdayIndex]} ${formatTime(target)}`;
  }

  if (target.year === current.year) {
    return language === "zh"
      ? `${formatChineseMonthDay(target)} ${formatTime(target)}`
      : `${formatEnglishMonthDay(target)} ${formatTime(target)}`;
  }

  return language === "zh"
    ? `${formatChineseFullDate(target)} ${formatTime(target)}`
    : `${formatEnglishFullDate(target)} ${formatTime(target)}`;
}

export function formatInboxMessageTime({
  timestamp,
  now = Date.now(),
  language,
  timeZone,
}: FormatMessageTimeArgs) {
  const resolvedTimeZone = resolveTimeZone(timeZone);
  const { target, current, dayDiff } = getDayDiff(timestamp, now, resolvedTimeZone);

  if (dayDiff <= 0) {
    return formatTime(target);
  }

  if (dayDiff === 1) {
    return language === "zh" ? "昨天" : "Yesterday";
  }

  if (language === "zh" && dayDiff < 7) {
    const weekdayIndex = new Date(
      Date.UTC(target.year, target.month - 1, target.day),
    ).getUTCDay();
    return ZH_WEEKDAY_LABELS[weekdayIndex];
  }

  if (language === "en") {
    return formatEnglishShortDate(target);
  }

  return target.year === current.year
    ? formatChineseMonthDay(target)
    : formatChineseFullDate(target);
}

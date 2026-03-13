type FormatArgs = {
  timestamp: number;
  now?: number;
  language?: "en" | "zh";
};

const ZH_WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"] as const;
const EN_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function getParts(timestamp: number) {
  const date = new Date(timestamp);
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    weekday: date.getDay(),
    hour: String(date.getHours()).padStart(2, "0"),
    minute: String(date.getMinutes()).padStart(2, "0"),
  };
}

function getDayIndex(timestamp: number) {
  const date = new Date(timestamp);
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

function formatTime(parts: { hour: string; minute: string }) {
  return `${parts.hour}:${parts.minute}`;
}

export function formatNativeInboxTime({ language = "en", now = Date.now(), timestamp }: FormatArgs) {
  const target = getParts(timestamp);
  const current = getParts(now);
  const dayDiff = getDayIndex(now) - getDayIndex(timestamp);

  if (dayDiff <= 0) {
    return formatTime(target);
  }

  if (dayDiff === 1) {
    return language === "zh" ? "昨天" : "Yesterday";
  }

  if (language === "zh" && dayDiff < 7) {
    return ZH_WEEKDAYS[target.weekday];
  }

  if (language === "zh") {
    return target.year === current.year
      ? `${target.month}月${target.day}日`
      : `${target.year}年${target.month}月${target.day}日`;
  }

  return `${target.month}/${target.day}/${String(target.year).slice(-2)}`;
}

export function formatNativeChatTime({ language = "en", now = Date.now(), timestamp }: FormatArgs) {
  const target = getParts(timestamp);
  const current = getParts(now);
  const dayDiff = getDayIndex(now) - getDayIndex(timestamp);
  const time = formatTime(target);

  if (dayDiff <= 0) {
    return time;
  }

  if (dayDiff === 1) {
    return language === "zh" ? `昨天 ${time}` : `Yesterday ${time}`;
  }

  if (language === "zh" && dayDiff < 7) {
    return `${ZH_WEEKDAYS[target.weekday]} ${time}`;
  }

  if (language === "zh") {
    return target.year === current.year
      ? `${target.month}月${target.day}日 ${time}`
      : `${target.year}年${target.month}月${target.day}日 ${time}`;
  }

  const date = `${target.day} ${new Intl.DateTimeFormat("en-US", { month: "long" }).format(
    new Date(timestamp),
  )}`;
  return target.year === current.year ? `${date} ${time}` : `${date} ${target.year} ${time}`;
}

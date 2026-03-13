import {
  formatChatMessageTime,
  formatInboxMessageTime,
} from "../relativeMessageTime";

describe("formatChatMessageTime", () => {
  const now = Date.parse("2026-03-08T15:20:00+08:00");
  const timeZone = "Asia/Shanghai";

  test("formats same-day timestamps as hour and minute", () => {
    expect(
      formatChatMessageTime({
        timestamp: Date.parse("2026-03-08T09:05:00+08:00"),
        now,
        language: "zh",
        timeZone,
      }),
    ).toBe("09:05");
  });

  test("formats yesterday timestamps with time in Chinese chat", () => {
    expect(
      formatChatMessageTime({
        timestamp: Date.parse("2026-03-07T09:05:00+08:00"),
        now,
        language: "zh",
        timeZone,
      }),
    ).toBe("昨天 09:05");
  });

  test("formats recent timestamps as weekday and time in Chinese chat", () => {
    expect(
      formatChatMessageTime({
        timestamp: Date.parse("2026-03-05T18:45:00+08:00"),
        now,
        language: "zh",
        timeZone,
      }),
    ).toBe("周四 18:45");
  });

  test("formats older timestamps in the current year as month day and time in Chinese chat", () => {
    expect(
      formatChatMessageTime({
        timestamp: Date.parse("2026-02-27T11:15:00+08:00"),
        now,
        language: "zh",
        timeZone,
      }),
    ).toBe("2月27日 11:15");
  });

  test("formats older timestamps in a past year with full Chinese date in chat", () => {
    expect(
      formatChatMessageTime({
        timestamp: Date.parse("2025-12-27T11:15:00+08:00"),
        now,
        language: "zh",
        timeZone,
      }),
    ).toBe("2025年12月27日 11:15");
  });

  test("formats older English chat timestamps in the current year without weekday", () => {
    expect(
      formatChatMessageTime({
        timestamp: Date.parse("2026-03-05T18:45:00+08:00"),
        now,
        language: "en",
        timeZone,
      }),
    ).toBe("5 March 18:45");
  });

  test("formats older English chat timestamps in past years with full year", () => {
    expect(
      formatChatMessageTime({
        timestamp: Date.parse("2025-12-27T11:15:00+08:00"),
        now,
        language: "en",
        timeZone,
      }),
    ).toBe("27 December 2025 11:15");
  });
});

describe("formatInboxMessageTime", () => {
  const now = Date.parse("2026-03-08T15:20:00+08:00");
  const timeZone = "Asia/Shanghai";

  test("formats same-day timestamps as hour and minute", () => {
    expect(
      formatInboxMessageTime({
        timestamp: Date.parse("2026-03-08T09:05:00+08:00"),
        now,
        language: "zh",
        timeZone,
      }),
    ).toBe("09:05");
  });

  test("formats yesterday timestamps without time in Chinese inbox", () => {
    expect(
      formatInboxMessageTime({
        timestamp: Date.parse("2026-03-07T09:05:00+08:00"),
        now,
        language: "zh",
        timeZone,
      }),
    ).toBe("昨天");
  });

  test("formats recent timestamps as weekday only in Chinese inbox", () => {
    expect(
      formatInboxMessageTime({
        timestamp: Date.parse("2026-03-05T18:45:00+08:00"),
        now,
        language: "zh",
        timeZone,
      }),
    ).toBe("周四");
  });

  test("formats older timestamps in the current year as month day in Chinese inbox", () => {
    expect(
      formatInboxMessageTime({
        timestamp: Date.parse("2026-02-27T11:15:00+08:00"),
        now,
        language: "zh",
        timeZone,
      }),
    ).toBe("2月27日");
  });

  test("formats older timestamps in past years with full Chinese date in inbox", () => {
    expect(
      formatInboxMessageTime({
        timestamp: Date.parse("2025-12-27T11:15:00+08:00"),
        now,
        language: "zh",
        timeZone,
      }),
    ).toBe("2025年12月27日");
  });

  test("formats older English inbox timestamps as M/D/YY", () => {
    expect(
      formatInboxMessageTime({
        timestamp: Date.parse("2026-03-05T18:45:00+08:00"),
        now,
        language: "en",
        timeZone,
      }),
    ).toBe("3/5/26");
  });
});

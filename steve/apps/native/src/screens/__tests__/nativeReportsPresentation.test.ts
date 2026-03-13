import assert from "node:assert/strict";
import {
  formatNativeReportRelativeTime,
  getNativeReportTagLabel,
} from "../nativeReportsPresentation.ts";

assert.equal(
  formatNativeReportRelativeTime({
    language: "en",
    now: new Date(2026, 2, 12, 12, 0).getTime(),
    timestamp: new Date(2026, 2, 12, 11, 30).getTime(),
  }),
  "30m ago",
);

assert.equal(
  formatNativeReportRelativeTime({
    language: "zh",
    now: new Date(2026, 2, 12, 12, 0).getTime(),
    timestamp: new Date(2026, 2, 10, 12, 0).getTime(),
  }),
  "2天前",
);

assert.equal(
  getNativeReportTagLabel({ language: "en", tag: "milestone_offline_meetup" }),
  "Offline Meetup",
);

assert.equal(
  getNativeReportTagLabel({ language: "zh", tag: "unknown" }),
  "里程碑",
);

console.log("nativeReportsPresentation tests passed");

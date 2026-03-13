import assert from "node:assert/strict";
import { formatNativeChatTime, formatNativeInboxTime } from "../nativeRelativeMessageTime.ts";

const NOW = new Date(2026, 2, 12, 13, 30, 0).getTime();

assert.equal(
  formatNativeInboxTime({ timestamp: new Date(2026, 2, 12, 12, 10, 0).getTime(), now: NOW }),
  "12:10",
);
assert.equal(
  formatNativeInboxTime({
    timestamp: new Date(2026, 2, 11, 12, 10, 0).getTime(),
    now: NOW,
    language: "zh",
  }),
  "昨天",
);
assert.equal(
  formatNativeChatTime({
    timestamp: new Date(2026, 2, 11, 12, 10, 0).getTime(),
    now: NOW,
    language: "en",
  }),
  "Yesterday 12:10",
);

console.log("nativeRelativeMessageTime tests passed");

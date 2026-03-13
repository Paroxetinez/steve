import assert from "node:assert/strict";
import {
  createDemoSessionToken,
  resolveNativeSessionView,
} from "../nativeSessionModel.ts";

assert.equal(createDemoSessionToken(), "native-demo-session");

assert.deepEqual(
  resolveNativeSessionView({
    sessionReady: false,
    sessionToken: null,
  }),
  {
    status: "bootstrapping",
    isAuthenticated: false,
  },
);

assert.deepEqual(
  resolveNativeSessionView({
    sessionReady: true,
    sessionToken: null,
  }),
  {
    status: "unauthenticated",
    isAuthenticated: false,
  },
);

assert.deepEqual(
  resolveNativeSessionView({
    sessionReady: true,
    sessionToken: "session-123",
  }),
  {
    status: "authenticated",
    isAuthenticated: true,
  },
);

console.log("nativeSessionModel tests passed");

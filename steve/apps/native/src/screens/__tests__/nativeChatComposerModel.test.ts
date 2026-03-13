import assert from "node:assert/strict";
import { canSendNativeChatDraft } from "../nativeChatComposerModel.ts";

assert.equal(
  canSendNativeChatDraft({
    conversationId: "abc",
    draft: "hello",
    sending: false,
    sessionToken: "token",
  }),
  true,
);
assert.equal(
  canSendNativeChatDraft({
    conversationId: "abc",
    draft: "   ",
    sending: false,
    sessionToken: "token",
  }),
  false,
);
assert.equal(
  canSendNativeChatDraft({
    conversationId: "abc",
    draft: "hello",
    sending: true,
    sessionToken: "token",
  }),
  false,
);
assert.equal(
  canSendNativeChatDraft({
    conversationId: null,
    draft: "hello",
    sending: false,
    sessionToken: "token",
  }),
  false,
);

console.log("nativeChatComposerModel tests passed");

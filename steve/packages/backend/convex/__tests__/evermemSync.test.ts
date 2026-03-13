import {
  buildEverMemSyncRequest,
  shouldSyncConversationToEverMem,
} from "../evermemSync";

describe("shouldSyncConversationToEverMem", () => {
  test("syncs direct user messages", () => {
    expect(
      shouldSyncConversationToEverMem({
        conversationType: "direct",
        senderType: "user",
      }),
    ).toBe(true);
  });

  test("syncs direct Steve assistant messages", () => {
    expect(
      shouldSyncConversationToEverMem({
        conversationType: "direct",
        senderType: "assistant",
      }),
    ).toBe(true);
  });

  test("skips group messages in phase 1", () => {
    expect(
      shouldSyncConversationToEverMem({
        conversationType: "group",
        senderType: "user",
      }),
    ).toBe(false);
  });

  test("skips assistant-only Steve chat in phase 1", () => {
    expect(
      shouldSyncConversationToEverMem({
        conversationType: "assistant",
        senderType: "user",
      }),
    ).toBe(false);
  });
});

describe("buildEverMemSyncRequest", () => {
  test("builds a request payload for direct-chat sync", () => {
    const request = buildEverMemSyncRequest({
      conversationId: "conv_1",
      conversationName: "Alice x Bob",
      messageId: "msg_1",
      senderId: "user_1",
      senderName: "Alice",
      senderType: "user",
      content: "Let's get coffee",
      createdAt: 1730000000000,
      referList: ["msg_0"],
    });

    expect(request.messagePayload.group_id).toBe("steve:direct:conv_1");
    expect(request.messagePayload.role).toBe("user");
    expect(request.syncState.lastMirroredMessageId).toBe("msg_1");
    expect(request.syncState.lastMirroredMessageAt).toBe(1730000000000);
  });
});

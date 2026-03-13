import {
  buildEverMemGroupId,
  buildEverMemMessagePayload,
  buildPairMemoryCacheKey,
  buildUserMemoryCacheKey,
} from "../evermemContracts";

describe("buildEverMemGroupId", () => {
  test("maps a direct conversation id into a stable EverMemOS group id", () => {
    expect(buildEverMemGroupId("conv_123")).toBe("steve:direct:conv_123");
  });
});

describe("buildEverMemMessagePayload", () => {
  test("maps a Steve direct chat message into EverMemOS request shape", () => {
    const payload = buildEverMemMessagePayload({
      conversationId: "conv_123",
      conversationName: "Alice x Bob",
      messageId: "msg_123",
      senderId: "user_a",
      senderName: "Alice",
      role: "user",
      content: "We should meet this weekend",
      createdAt: 1730000000000,
      referList: ["msg_122"],
    });

    expect(payload).toEqual({
      message_id: "msg_123",
      create_time: "2024-10-27T03:33:20.000Z",
      sender: "user_a",
      sender_name: "Alice",
      role: "user",
      content: "We should meet this weekend",
      group_id: "steve:direct:conv_123",
      group_name: "Alice x Bob",
      refer_list: ["msg_122"],
    });
  });
});

describe("memory cache keys", () => {
  test("creates stable pair and user memory cache keys", () => {
    expect(buildPairMemoryCacheKey("conv_123")).toBe("pair:conv_123");
    expect(buildUserMemoryCacheKey("user_123")).toBe("user:user_123");
  });
});

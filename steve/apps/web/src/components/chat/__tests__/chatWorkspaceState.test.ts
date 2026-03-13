import { resolveChatWorkspaceState } from "../chatWorkspaceState";

describe("resolveChatWorkspaceState", () => {
  test("redirects to inbox when there are no available conversations", () => {
    expect(
      resolveChatWorkspaceState({
        conversations: [],
        requestedConversationId: null,
        activeConversationId: null,
      }),
    ).toEqual({
      nextActiveConversationId: null,
      shouldRedirectToInbox: true,
    });
  });

  test("selects requested conversation when it exists", () => {
    expect(
      resolveChatWorkspaceState({
        conversations: [{ id: "c1" }, { id: "c2" }],
        requestedConversationId: "c2",
        activeConversationId: null,
      }),
    ).toEqual({
      nextActiveConversationId: "c2",
      shouldRedirectToInbox: false,
    });
  });
});

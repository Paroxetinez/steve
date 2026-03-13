import { resolveChatAvatarHref } from "../chatAvatarNavigation";

describe("resolveChatAvatarHref", () => {
  test("routes current-user avatars to personal profile", () => {
    expect(
      resolveChatAvatarHref({
        isCurrentUser: true,
      }),
    ).toBe("/personal-profile");
  });

  test("routes direct-chat peer avatars to the connected profile page", () => {
    expect(
      resolveChatAvatarHref({
        isCurrentUser: false,
        conversationType: "direct",
        targetUserId: "user_123",
      }),
    ).toBe("/search-result?userId=user_123&includeConnected=1");
  });

  test("returns null when a peer avatar should not be clickable", () => {
    expect(
      resolveChatAvatarHref({
        isCurrentUser: false,
        conversationType: "assistant",
      }),
    ).toBeNull();
  });
});

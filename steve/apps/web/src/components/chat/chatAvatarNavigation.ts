import { buildSearchResultHref } from "../search/searchResultSeed";

type ResolveChatAvatarHrefArgs = {
  isCurrentUser: boolean;
  conversationType?: "direct" | "group" | "assistant";
  targetUserId?: string;
  nickname?: string;
  avatarUrl?: string;
};

export function resolveChatAvatarHref({
  isCurrentUser,
  conversationType,
  targetUserId,
  nickname,
  avatarUrl,
}: ResolveChatAvatarHrefArgs) {
  if (isCurrentUser) {
    return "/personal-profile";
  }

  if (conversationType === "direct" && targetUserId) {
    return buildSearchResultHref({
      userId: targetUserId,
      includeConnected: true,
      nickname,
      avatarUrl,
    });
  }

  return null;
}

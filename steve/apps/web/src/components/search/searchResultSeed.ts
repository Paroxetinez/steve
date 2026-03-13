type BuildSearchResultHrefArgs = {
  userId: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  includeConnected?: boolean;
};

type ResolveSeededSearchResultArgs = {
  userId: string | null;
  nickname?: string | null;
  avatarUrl?: string | null;
};

function trimOrNull(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function buildSearchResultHref({
  userId,
  nickname,
  avatarUrl,
  includeConnected = false,
}: BuildSearchResultHrefArgs) {
  const params = new URLSearchParams({
    userId,
  });

  if (includeConnected) {
    params.set("includeConnected", "1");
  }

  const normalizedNickname = trimOrNull(nickname);
  if (normalizedNickname) {
    params.set("nickname", normalizedNickname);
  }

  const normalizedAvatarUrl = trimOrNull(avatarUrl);
  if (normalizedAvatarUrl) {
    params.set("avatarUrl", normalizedAvatarUrl);
  }

  return `/search-result?${params.toString()}`;
}

export function resolveSeededSearchResult({
  userId,
  nickname,
  avatarUrl,
}: ResolveSeededSearchResultArgs) {
  const normalizedUserId = trimOrNull(userId);
  if (!normalizedUserId) {
    return null;
  }

  return {
    userId: normalizedUserId,
    nickname: trimOrNull(nickname) ?? "",
    avatarUrl: trimOrNull(avatarUrl) ?? undefined,
    compatibility: [] as string[],
    displayId: "-",
    isConnected: false,
  };
}

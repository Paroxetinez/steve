const cachedAvatarUrls = new Set<string>();

export function hasCachedNativeAvatar(url: string | null | undefined) {
  return Boolean(url && cachedAvatarUrls.has(url));
}

export function markNativeAvatarCached(url: string | null | undefined) {
  if (url) {
    cachedAvatarUrls.add(url);
  }
}

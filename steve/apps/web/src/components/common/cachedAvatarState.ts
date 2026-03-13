type ResolveCachedAvatarPhaseArgs = {
  src: string | null | undefined;
  loadedUrls: Set<string>;
};

export function resolveCachedAvatarPhase({
  src,
  loadedUrls,
}: ResolveCachedAvatarPhaseArgs) {
  const normalizedSrc = src?.trim();
  if (!normalizedSrc) {
    return "fallback";
  }

  return loadedUrls.has(normalizedSrc) ? "image" : "fallback";
}

import { buildPublicMediaUrl } from "./r2Media";

const IMAGE_MESSAGE_PREFIX = "__IMAGE__:";

export function pickResolvedUrl(
  resolvedStorageUrl: string | null | undefined,
  legacyUrl: string | null | undefined,
) {
  return resolvedStorageUrl ?? legacyUrl ?? null;
}

export function getLegacyImageUrl(content: string) {
  if (!content.startsWith(IMAGE_MESSAGE_PREFIX)) {
    return null;
  }

  const url = content.slice(IMAGE_MESSAGE_PREFIX.length).trim();
  return url || null;
}

export function resolveStoredAvatarUrl(input: {
  objectKey: string | null | undefined;
  resolvedStorageUrl: string | null | undefined;
  legacyUrl: string | null | undefined;
}) {
  if (input.objectKey) {
    return buildPublicMediaUrl(input.objectKey);
  }

  return pickResolvedUrl(input.resolvedStorageUrl, input.legacyUrl);
}

export function getBackfillableAvatarSourceUrl(input: {
  objectKey: string | null | undefined;
  resolvedStorageUrl: string | null | undefined;
  legacyUrl: string | null | undefined;
}) {
  if (input.objectKey) {
    return null;
  }

  return pickResolvedUrl(input.resolvedStorageUrl, input.legacyUrl);
}

export function resolveStoredImageUrl(input: {
  objectKey: string | null | undefined;
  resolvedStorageUrl: string | null | undefined;
  legacyContent: string;
}) {
  if (input.objectKey) {
    return buildPublicMediaUrl(input.objectKey);
  }

  return pickResolvedUrl(
    input.resolvedStorageUrl,
    getLegacyImageUrl(input.legacyContent),
  );
}

export function getBackfillableImageSourceUrl(input: {
  objectKey: string | null | undefined;
  resolvedStorageUrl: string | null | undefined;
  legacyContent: string;
}) {
  if (input.objectKey) {
    return null;
  }

  return pickResolvedUrl(
    input.resolvedStorageUrl,
    getLegacyImageUrl(input.legacyContent),
  );
}

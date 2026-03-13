import { getLegacyImageUrl, resolveStoredImageUrl } from "./chatMediaHelpers";

type StoredMessageContentType = "text" | "image";

export function normalizeStoredMessageSemantics(input: {
  content: string;
  contentType: StoredMessageContentType;
  objectKey: string | null | undefined;
  resolvedStorageUrl: string | null | undefined;
}) {
  const imageUrl =
    resolveStoredImageUrl({
      objectKey: input.objectKey,
      resolvedStorageUrl: input.resolvedStorageUrl,
      legacyContent: input.content,
    }) ?? undefined;

  let compatibilitySource: "none" | "objectKey" | "storageUrl" | "legacyContent" = "none";

  if (input.objectKey) {
    compatibilitySource = "objectKey";
  } else if (input.resolvedStorageUrl) {
    compatibilitySource = "storageUrl";
  } else if (getLegacyImageUrl(input.content)) {
    compatibilitySource = "legacyContent";
  }

  return {
    normalizedContentType:
      input.contentType === "image" || imageUrl ? ("image" as const) : ("text" as const),
    imageUrl,
    compatibilitySource,
  };
}

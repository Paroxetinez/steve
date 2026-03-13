const CONTENT_TYPE_BY_EXTENSION = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const EXTENSION_BY_CONTENT_TYPE = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function normalizeHeaderContentType(value) {
  if (!value) return null;
  return value.split(";")[0].trim().toLowerCase();
}

function normalizeBackfillContentType(headerContentType, sourceUrl) {
  const normalizedHeader = normalizeHeaderContentType(headerContentType);
  if (normalizedHeader && EXTENSION_BY_CONTENT_TYPE[normalizedHeader]) {
    return normalizedHeader === "image/jpg" ? "image/jpeg" : normalizedHeader;
  }

  const url = new URL(sourceUrl);
  const matchedExtension = Object.keys(CONTENT_TYPE_BY_EXTENSION).find((extension) =>
    url.pathname.toLowerCase().endsWith(extension),
  );

  if (matchedExtension) {
    return CONTENT_TYPE_BY_EXTENSION[matchedExtension];
  }

  throw new Error("Unsupported image content type");
}

function extensionForContentType(contentType) {
  const normalized = normalizeBackfillContentType(contentType, "https://example.com/file");
  return EXTENSION_BY_CONTENT_TYPE[normalized];
}

function buildAvatarBackfillObjectKey(userId, contentType) {
  return `profile/avatars/${userId}/${crypto.randomUUID()}.${extensionForContentType(contentType)}`;
}

function buildConversationBackfillObjectKey(conversationId, contentType) {
  return `conversation_media/images/${conversationId}/${crypto.randomUUID()}.${extensionForContentType(contentType)}`;
}

module.exports = {
  buildAvatarBackfillObjectKey,
  buildConversationBackfillObjectKey,
  normalizeBackfillContentType,
};

const DEFAULT_PUBLIC_BASE_URL = "https://steve.haloworld.me";

type UploadSigner = (input: {
  objectKey: string;
  contentType: string;
}) => Promise<string>;

type UploadTarget = {
  objectKey: string;
  publicUrl: string;
  uploadUrl: string;
};

export function normalizeImageExtension(contentType: string) {
  switch (contentType.toLowerCase()) {
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      throw new Error("Unsupported image content type");
  }
}

function getPublicBaseUrl() {
  return (process.env.R2_PUBLIC_BASE_URL ?? DEFAULT_PUBLIC_BASE_URL).replace(/\/+$/, "");
}

export function buildAvatarObjectKey(userId: string, contentType: string) {
  const ext = normalizeImageExtension(contentType);
  return `profile/avatars/${userId}/${crypto.randomUUID()}.${ext}`;
}

export function buildConversationImageObjectKey(
  conversationId: string,
  contentType: string,
) {
  const ext = normalizeImageExtension(contentType);
  return `conversation_media/images/${conversationId}/${crypto.randomUUID()}.${ext}`;
}

export function buildPublicMediaUrl(objectKey: string) {
  const trimmedKey = objectKey.replace(/^\/+/, "");
  return `${getPublicBaseUrl()}/${trimmedKey}`;
}

async function createUploadTarget(input: {
  objectKey: string;
  contentType: string;
  signUpload: UploadSigner;
}): Promise<UploadTarget> {
  return {
    objectKey: input.objectKey,
    publicUrl: buildPublicMediaUrl(input.objectKey),
    uploadUrl: await input.signUpload({
      objectKey: input.objectKey,
      contentType: input.contentType,
    }),
  };
}

export function createAvatarUploadTarget(input: {
  userId: string;
  contentType: string;
  signUpload: UploadSigner;
}) {
  return createUploadTarget({
    objectKey: buildAvatarObjectKey(input.userId, input.contentType),
    contentType: input.contentType,
    signUpload: input.signUpload,
  });
}

export function createConversationImageUploadTarget(input: {
  conversationId: string;
  contentType: string;
  signUpload: UploadSigner;
}) {
  return createUploadTarget({
    objectKey: buildConversationImageObjectKey(
      input.conversationId,
      input.contentType,
    ),
    contentType: input.contentType,
    signUpload: input.signUpload,
  });
}

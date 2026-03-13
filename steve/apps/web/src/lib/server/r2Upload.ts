import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const DEFAULT_PUBLIC_BASE_URL = "https://steve.haloworld.me";
const R2_REGION = "auto";
const PRESIGNED_UPLOAD_EXPIRES_IN_SECONDS = 60 * 5;

let r2Client: S3Client | null = null;

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getPublicBaseUrl() {
  return (process.env.R2_PUBLIC_BASE_URL ?? DEFAULT_PUBLIC_BASE_URL).replace(/\/+$/, "");
}

function normalizeImageExtension(contentType: string) {
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

function getR2Client() {
  if (r2Client) {
    return r2Client;
  }

  r2Client = new S3Client({
    region: R2_REGION,
    endpoint: `https://${getRequiredEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    forcePathStyle: true,
    credentials: {
      accessKeyId: getRequiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: getRequiredEnv("R2_SECRET_ACCESS_KEY"),
    },
  });

  return r2Client;
}

function buildPublicMediaUrl(objectKey: string) {
  return `${getPublicBaseUrl()}/${objectKey.replace(/^\/+/, "")}`;
}

function buildAvatarObjectKey(userId: string, contentType: string) {
  return `profile/avatars/${userId}/${crypto.randomUUID()}.${normalizeImageExtension(contentType)}`;
}

function buildConversationImageObjectKey(conversationId: string, contentType: string) {
  return `conversation_media/images/${conversationId}/${crypto.randomUUID()}.${normalizeImageExtension(contentType)}`;
}

async function createPresignedUploadUrl(input: {
  objectKey: string;
  contentType: string;
}) {
  const command = new PutObjectCommand({
    Bucket: getRequiredEnv("R2_BUCKET_NAME"),
    Key: input.objectKey,
    ContentType: input.contentType,
  });

  return getSignedUrl(getR2Client(), command, {
    expiresIn: PRESIGNED_UPLOAD_EXPIRES_IN_SECONDS,
  });
}

async function uploadObjectToR2(input: {
  objectKey: string;
  contentType: string;
  body: Uint8Array;
}) {
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getRequiredEnv("R2_BUCKET_NAME"),
      Key: input.objectKey,
      ContentType: input.contentType,
      Body: input.body,
    }),
  );
}

export async function createAvatarUploadTarget(input: {
  userId: string;
  contentType: string;
}) {
  const objectKey = buildAvatarObjectKey(input.userId, input.contentType);
  return {
    objectKey,
    publicUrl: buildPublicMediaUrl(objectKey),
    uploadUrl: await createPresignedUploadUrl({
      objectKey,
      contentType: input.contentType,
    }),
  };
}

export async function createConversationImageUploadTarget(input: {
  conversationId: string;
  contentType: string;
}) {
  const objectKey = buildConversationImageObjectKey(
    input.conversationId,
    input.contentType,
  );
  return {
    objectKey,
    publicUrl: buildPublicMediaUrl(objectKey),
    uploadUrl: await createPresignedUploadUrl({
      objectKey,
      contentType: input.contentType,
    }),
  };
}

export async function uploadConversationImage(input: {
  conversationId: string;
  contentType: string;
  body: Uint8Array;
}) {
  const objectKey = buildConversationImageObjectKey(
    input.conversationId,
    input.contentType,
  );

  await uploadObjectToR2({
    objectKey,
    contentType: input.contentType,
    body: input.body,
  });

  return {
    objectKey,
    publicUrl: buildPublicMediaUrl(objectKey),
  };
}

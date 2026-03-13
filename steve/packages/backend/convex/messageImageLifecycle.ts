import type { Id } from "./_generated/dataModel";
import type { ChatImageMetadata } from "./chatMediaContract";

const IMAGE_MESSAGE_PREVIEW = "[image]";

export function buildPendingImageMessageFields(input: {
  conversationId: Id<"conversations">;
  senderUserId: Id<"users">;
  createdAt: number;
  clientMessageId?: string;
}) {
  return {
    conversationId: input.conversationId,
    senderUserId: input.senderUserId,
    senderType: "user" as const,
    content: IMAGE_MESSAGE_PREVIEW,
    contentType: "image" as const,
    imageUploadStatus: "uploading" as const,
    imageUploadError: undefined,
    pendingImageObjectKey: undefined,
    clientMessageId: input.clientMessageId,
    createdAt: input.createdAt,
  };
}

export function buildReadyImageMessagePatch(input: {
  objectKey: string;
  metadata?: ChatImageMetadata;
}) {
  return {
    imageObjectKey: input.objectKey,
    imageUploadStatus: "ready" as const,
    imageUploadError: undefined,
    pendingImageObjectKey: undefined,
    imageMimeType: input.metadata?.mimeType,
    imageSizeBytes: input.metadata?.sizeBytes,
    imageWidth: input.metadata?.width,
    imageHeight: input.metadata?.height,
  };
}

export function buildFailedImageMessagePatch(input: { error: string }) {
  return {
    imageUploadStatus: "failed" as const,
    imageUploadError: input.error,
  };
}

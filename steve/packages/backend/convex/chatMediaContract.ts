export const CHAT_IMAGE_UPLOAD_STATUSES = ["uploading", "ready", "failed"] as const;

export type ChatImageUploadStatus = (typeof CHAT_IMAGE_UPLOAD_STATUSES)[number];

export type ChatImageMetadata = {
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
};

export type ConversationImageUploadTarget = {
  objectKey: string;
  publicUrl: string;
  uploadUrl: string;
};

export function hasCompleteChatImageMetadata(
  metadata: Partial<ChatImageMetadata> | null | undefined,
): metadata is ChatImageMetadata {
  return Boolean(
    metadata &&
      metadata.mimeType &&
      metadata.sizeBytes !== undefined &&
      metadata.width !== undefined &&
      metadata.height !== undefined,
  );
}

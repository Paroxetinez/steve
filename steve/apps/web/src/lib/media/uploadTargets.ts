import type { ConversationImageUploadTarget } from "@packages/backend/convex/chatMediaContract";
import type { Id } from "@packages/backend/convex/_generated/dataModel";

type UploadTarget = ConversationImageUploadTarget;

type UploadedMedia = {
  objectKey: string;
  publicUrl: string;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function parseJsonResponse<T>(response: Response): Promise<{
  data: T | null;
  text: string;
}> {
  const text = await response.text();
  if (!text) {
    return { data: null, text };
  }

  try {
    return {
      data: JSON.parse(text) as T,
      text,
    };
  } catch {
    return {
      data: null,
      text,
    };
  }
}

async function postUploadTarget<TBody extends Record<string, unknown>>(
  path: string,
  body: TBody,
): Promise<UploadTarget> {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const { data, text } = await parseJsonResponse<UploadTarget & { error?: string }>(response);
  const result = data;
  if (!response.ok) {
    throw new Error(result?.error ?? text ?? "Failed to create upload target");
  }

  if (!result?.objectKey || !result.uploadUrl || !result.publicUrl) {
    throw new Error("Upload target response is incomplete");
  }

  return result;
}

export function requestAvatarUploadTarget(input: {
  sessionToken: string;
  contentType: string;
}) {
  return postUploadTarget("/api/media/avatar-upload-target", input);
}

export function requestConversationImageUploadTarget(input: {
  sessionToken: string;
  conversationId: Id<"conversations">;
  contentType: string;
}) {
  return postUploadTarget("/api/media/conversation-image-upload-target", input);
}

export async function uploadFileToSignedUrl(input: {
  uploadUrl: string;
  file: File;
}) {
  const response = await fetch(input.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": input.file.type || "application/octet-stream",
    },
    body: input.file,
  });

  if (!response.ok) {
    throw new Error("Upload request failed");
  }
}

function isNetworkUploadError(error: unknown) {
  return (
    error instanceof TypeError ||
    (error instanceof Error && /failed to fetch/i.test(error.message))
  );
}

export async function uploadConversationImageViaApi(input: {
  sessionToken: string;
  conversationId: Id<"conversations">;
  file: File;
}): Promise<UploadedMedia> {
  const formData = new FormData();
  formData.set("sessionToken", input.sessionToken);
  formData.set("conversationId", input.conversationId);
  formData.set("file", input.file);

  const response = await fetch("/api/media/conversation-image-upload", {
    method: "POST",
    body: formData,
  });

  const { data, text } = await parseJsonResponse<UploadedMedia & { error?: string }>(response);
  const result = data;
  if (!response.ok) {
    throw new Error(result?.error ?? text ?? "Failed to upload image");
  }

  if (!result?.objectKey || !result.publicUrl) {
    throw new Error("Image upload response is incomplete");
  }

  return result;
}

export async function uploadConversationImageWithFallback(input: {
  sessionToken: string;
  conversationId: Id<"conversations">;
  file: File;
}): Promise<UploadedMedia> {
  let target: UploadTarget;
  try {
    target = await requestConversationImageUploadTarget({
      sessionToken: input.sessionToken,
      conversationId: input.conversationId,
      contentType: input.file.type,
    });
  } catch (error) {
    throw new Error(
      `Upload target failed: ${getErrorMessage(error, "Failed to create upload target")}`,
    );
  }

  try {
    await uploadFileToSignedUrl({
      uploadUrl: target.uploadUrl,
      file: input.file,
    });
  } catch (error) {
    const fallbackMessage = isNetworkUploadError(error)
      ? "Failed to fetch"
      : "Upload request failed";
    throw new Error(`Direct upload failed: ${getErrorMessage(error, fallbackMessage)}`);
  }

  return {
    objectKey: target.objectKey,
    publicUrl: target.publicUrl,
  };
}

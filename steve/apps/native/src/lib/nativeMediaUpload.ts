import * as ImagePicker from "expo-image-picker";
import type { ConversationImageUploadTarget } from "@packages/backend/convex/chatMediaContract";
import type { Id } from "@packages/backend/convex/_generated/dataModel";

const WEB_APP_URL = process.env.EXPO_PUBLIC_WEB_APP_URL ?? "https://steve.linchance.com";

type NativeUploadTarget = ConversationImageUploadTarget;

export type PickedNativeImage = {
  fileName: string;
  fileSize?: number;
  height: number;
  mimeType: string;
  uri: string;
  width: number;
};

export async function pickNativeImageFromLibrary() {
  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: false,
    mediaTypes: ["images"],
    quality: 0.7,
    selectionLimit: 1,
  });

  if (result.canceled || !result.assets.length) {
    return null;
  }

  const asset = result.assets[0];
  return {
    fileName: asset.fileName ?? `upload-${Date.now()}.jpg`,
    fileSize: asset.fileSize,
    height: asset.height,
    mimeType: asset.mimeType ?? "image/jpeg",
    uri: asset.uri,
    width: asset.width,
  } satisfies PickedNativeImage;
}

async function postJson<TBody extends Record<string, unknown>, TResult>(path: string, body: TBody) {
  const response = await fetch(`${WEB_APP_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as TResult & { error?: string }) : null;
  if (!response.ok) {
    throw new Error(data?.error ?? text ?? "Request failed");
  }

  return data as TResult;
}

export async function requestNativeConversationImageUploadTarget(input: {
  contentType: string;
  conversationId: Id<"conversations">;
  sessionToken: string;
}) {
  return postJson<typeof input, NativeUploadTarget>(
    "/api/media/conversation-image-upload-target",
    input,
  );
}

export async function requestNativeAvatarUploadTarget(input: {
  contentType: string;
  sessionToken: string;
}) {
  return postJson<typeof input, NativeUploadTarget>("/api/media/avatar-upload-target", input);
}

export async function uploadNativeAssetToSignedUrl(input: {
  asset: PickedNativeImage;
  uploadUrl: string;
}) {
  const assetResponse = await fetch(input.asset.uri);
  const blob = await assetResponse.blob();
  const response = await fetch(input.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": input.asset.mimeType,
    },
    body: blob,
  });

  if (!response.ok) {
    throw new Error("Upload request failed");
  }
}

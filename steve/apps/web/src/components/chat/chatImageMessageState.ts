export function resolveChatImageMessageState(input: {
  contentType: "text" | "image";
  imageUrl?: string;
  imageUploadStatus?: "uploading" | "ready" | "failed";
  language: "en" | "zh";
}) {
  if (input.contentType !== "image") {
    return null;
  }

  if (input.imageUrl) {
    return {
      kind: "image" as const,
      imageUrl: input.imageUrl,
    };
  }

  if (input.imageUploadStatus === "failed") {
    return {
      kind: "status" as const,
      text: input.language === "zh" ? "图片发送失败" : "Image failed to send",
    };
  }

  if (input.imageUploadStatus === "uploading") {
    return {
      kind: "status" as const,
      text: input.language === "zh" ? "图片发送中..." : "Sending image...",
    };
  }

  return {
    kind: "status" as const,
    text: input.language === "zh" ? "图片不可用" : "Image unavailable",
  };
}

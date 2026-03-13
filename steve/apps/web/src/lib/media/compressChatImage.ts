import type { ChatImageMetadata } from "@packages/backend/convex/chatMediaContract";

const COMPRESSED_IMAGE_MIME_TYPE = "image/jpeg";
const COMPRESSED_IMAGE_QUALITY = 0.82;
const MAX_IMAGE_DIMENSION = 1600;

export type CompressedChatImage = {
  file: File;
  metadata: ChatImageMetadata;
};

function replaceFileExtension(name: string) {
  const lastDot = name.lastIndexOf(".");
  const stem = lastDot > 0 ? name.slice(0, lastDot) : name;
  return `${stem}.jpg`;
}

function loadImageFromObjectUrl(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to decode image"));
    image.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode image"));
          return;
        }

        resolve(blob);
      },
      COMPRESSED_IMAGE_MIME_TYPE,
      COMPRESSED_IMAGE_QUALITY,
    );
  });
}

function getTargetDimensions(width: number, height: number) {
  const longestSide = Math.max(width, height);
  if (!Number.isFinite(longestSide) || longestSide <= MAX_IMAGE_DIMENSION) {
    return { width, height };
  }

  const scale = MAX_IMAGE_DIMENSION / longestSide;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function buildCompressedImageResult(file: File, width: number, height: number): CompressedChatImage {
  return {
    file,
    metadata: {
      mimeType: file.type || COMPRESSED_IMAGE_MIME_TYPE,
      sizeBytes: file.size,
      width,
      height,
    },
  };
}

export async function compressChatImage(file: File): Promise<CompressedChatImage> {
  if (typeof document === "undefined" || typeof Image === "undefined") {
    return buildCompressedImageResult(file, 0, 0);
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImageFromObjectUrl(objectUrl);
    const targetSize = getTargetDimensions(image.width, image.height);
    const canvas = document.createElement("canvas");
    canvas.width = targetSize.width;
    canvas.height = targetSize.height;

    const context = canvas.getContext("2d");
    if (!context) {
      return buildCompressedImageResult(file, image.width, image.height);
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await canvasToBlob(canvas);
    const compressedFile = new File([blob], replaceFileExtension(file.name), {
      type: COMPRESSED_IMAGE_MIME_TYPE,
      lastModified: Date.now(),
    });
    return buildCompressedImageResult(compressedFile, canvas.width, canvas.height);
  } catch {
    return buildCompressedImageResult(file, 0, 0);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

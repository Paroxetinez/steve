import {
  buildFailedImageMessagePatch,
  buildPendingImageMessageFields,
  buildReadyImageMessagePatch,
} from "../messageImageLifecycle";

describe("buildPendingImageMessageFields", () => {
  test("creates an uploading image message placeholder", () => {
    expect(
      buildPendingImageMessageFields({
        conversationId: "c1" as never,
        senderUserId: "u1" as never,
        createdAt: 123,
        clientMessageId: "client-1",
      }),
    ).toEqual({
      conversationId: "c1",
      senderUserId: "u1",
      senderType: "user",
      content: "[image]",
      contentType: "image",
      imageUploadStatus: "uploading",
      imageUploadError: undefined,
      pendingImageObjectKey: undefined,
      clientMessageId: "client-1",
      createdAt: 123,
    });
  });
});

describe("buildReadyImageMessagePatch", () => {
  test("marks a pending image message as ready", () => {
    expect(
      buildReadyImageMessagePatch({
        objectKey: "conversation_media/images/c1/test.jpg",
        metadata: {
          mimeType: "image/jpeg",
          sizeBytes: 1234,
          width: 800,
          height: 600,
        },
      }),
    ).toEqual({
      imageObjectKey: "conversation_media/images/c1/test.jpg",
      imageUploadStatus: "ready",
      imageUploadError: undefined,
      pendingImageObjectKey: undefined,
      imageMimeType: "image/jpeg",
      imageSizeBytes: 1234,
      imageWidth: 800,
      imageHeight: 600,
    });
  });
});

describe("buildFailedImageMessagePatch", () => {
  test("marks a pending image message as failed and preserves the error", () => {
    expect(
      buildFailedImageMessagePatch({
        error: "Direct upload failed: Failed to fetch",
      }),
    ).toEqual({
      imageUploadStatus: "failed",
      imageUploadError: "Direct upload failed: Failed to fetch",
    });
  });
});

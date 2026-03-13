import { resolveChatImageMessageState } from "../chatImageMessageState";

describe("resolveChatImageMessageState", () => {
  test("returns uploading state copy for a pending image", () => {
    expect(
      resolveChatImageMessageState({
        contentType: "image",
        imageUrl: undefined,
        imageUploadStatus: "uploading",
        language: "en",
      }),
    ).toEqual({
      kind: "status",
      text: "Sending image...",
    });
  });

  test("returns failed state copy for a failed image", () => {
    expect(
      resolveChatImageMessageState({
        contentType: "image",
        imageUrl: undefined,
        imageUploadStatus: "failed",
        language: "zh",
      }),
    ).toEqual({
      kind: "status",
      text: "图片发送失败",
    });
  });

  test("returns image rendering when an uploaded image url exists", () => {
    expect(
      resolveChatImageMessageState({
        contentType: "image",
        imageUrl: "https://steve.haloworld.me/conversation_media/images/c1/test.jpg",
        imageUploadStatus: "ready",
        language: "en",
      }),
    ).toEqual({
      kind: "image",
      imageUrl: "https://steve.haloworld.me/conversation_media/images/c1/test.jpg",
    });
  });
});

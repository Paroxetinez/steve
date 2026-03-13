import {
  CHAT_IMAGE_UPLOAD_STATUSES,
  hasCompleteChatImageMetadata,
} from "../chatMediaContract";

describe("chatMediaContract", () => {
  test("defines the shared upload lifecycle states", () => {
    expect(CHAT_IMAGE_UPLOAD_STATUSES).toEqual(["uploading", "ready", "failed"]);
  });

  test("recognizes complete image metadata payloads", () => {
    expect(
      hasCompleteChatImageMetadata({
        mimeType: "image/jpeg",
        sizeBytes: 1024,
        width: 800,
        height: 600,
      }),
    ).toBe(true);
  });

  test("rejects partial image metadata payloads", () => {
    expect(
      hasCompleteChatImageMetadata({
        mimeType: "image/jpeg",
        width: 800,
      }),
    ).toBe(false);
  });
});

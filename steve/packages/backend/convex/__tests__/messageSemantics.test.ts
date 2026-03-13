import { normalizeStoredMessageSemantics } from "../messageSemantics";

describe("normalizeStoredMessageSemantics", () => {
  test("keeps normal text messages as text", () => {
    expect(
      normalizeStoredMessageSemantics({
        content: "hello",
        contentType: "text",
        objectKey: null,
        resolvedStorageUrl: null,
      }),
    ).toEqual({
      normalizedContentType: "text",
      imageUrl: undefined,
      compatibilitySource: "none",
    });
  });

  test("treats object-key backed image messages as images", () => {
    expect(
      normalizeStoredMessageSemantics({
        content: "[image]",
        contentType: "image",
        objectKey: "conversation_media/images/c1/test.jpg",
        resolvedStorageUrl: null,
      }),
    ).toEqual({
      normalizedContentType: "image",
      imageUrl: "https://steve.haloworld.me/conversation_media/images/c1/test.jpg",
      compatibilitySource: "objectKey",
    });
  });

  test("treats legacy url-backed image content as images", () => {
    expect(
      normalizeStoredMessageSemantics({
        content: "__IMAGE__:https://legacy.example/pic.jpg",
        contentType: "text",
        objectKey: null,
        resolvedStorageUrl: null,
      }),
    ).toEqual({
      normalizedContentType: "image",
      imageUrl: "https://legacy.example/pic.jpg",
      compatibilitySource: "legacyContent",
    });
  });
});

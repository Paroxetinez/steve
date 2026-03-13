import {
  buildAvatarBackfillObjectKey,
  buildConversationBackfillObjectKey,
  normalizeBackfillContentType,
} from "../../../../scripts/lib/r2-backfill-helpers.js";

describe("normalizeBackfillContentType", () => {
  test("keeps supported image content types from response headers", () => {
    expect(normalizeBackfillContentType("image/png", "https://example.com/a.jpg")).toBe(
      "image/png",
    );
  });

  test("falls back to URL extension when header is missing", () => {
    expect(normalizeBackfillContentType(undefined, "https://example.com/a.webp")).toBe(
      "image/webp",
    );
  });

  test("rejects unsupported content types", () => {
    expect(() =>
      normalizeBackfillContentType("application/pdf", "https://example.com/a.pdf"),
    ).toThrow("Unsupported image content type");
  });
});

describe("backfill object key builders", () => {
  test("builds avatar backfill keys under the avatar prefix", () => {
    expect(buildAvatarBackfillObjectKey("user_123", "image/jpeg")).toMatch(
      /^profile\/avatars\/user_123\/[0-9a-f-]{36}\.jpg$/,
    );
  });

  test("builds message image backfill keys under the image prefix", () => {
    expect(buildConversationBackfillObjectKey("conversation_456", "image/webp")).toMatch(
      /^conversation_media\/images\/conversation_456\/[0-9a-f-]{36}\.webp$/,
    );
  });
});

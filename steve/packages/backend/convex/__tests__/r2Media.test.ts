import {
  buildAvatarObjectKey,
  buildConversationImageObjectKey,
  createAvatarUploadTarget,
  createConversationImageUploadTarget,
  buildPublicMediaUrl,
  normalizeImageExtension,
} from "../r2Media";

describe("buildAvatarObjectKey", () => {
  test("builds avatar object keys under the avatar prefix", () => {
    const key = buildAvatarObjectKey("user_123", "image/jpeg");

    expect(key).toMatch(
      /^profile\/avatars\/user_123\/[0-9a-f-]{36}\.jpg$/,
    );
  });
});

describe("buildConversationImageObjectKey", () => {
  test("builds conversation image keys under the conversation image prefix", () => {
    const key = buildConversationImageObjectKey("conversation_456", "image/webp");

    expect(key).toMatch(
      /^conversation_media\/images\/conversation_456\/[0-9a-f-]{36}\.webp$/,
    );
  });
});

describe("buildPublicMediaUrl", () => {
  test("builds public media urls from the configured base url", () => {
    process.env.R2_PUBLIC_BASE_URL = "https://steve.haloworld.me";

    expect(buildPublicMediaUrl("profile/avatars/user_123/avatar.jpg")).toBe(
      "https://steve.haloworld.me/profile/avatars/user_123/avatar.jpg",
    );
  });
});

describe("normalizeImageExtension", () => {
  test("maps common image mime types to safe file extensions", () => {
    expect(normalizeImageExtension("image/png")).toBe("png");
    expect(normalizeImageExtension("image/jpeg")).toBe("jpg");
    expect(normalizeImageExtension("image/webp")).toBe("webp");
  });

  test("rejects unsupported mime types", () => {
    expect(() => normalizeImageExtension("text/plain")).toThrow(
      "Unsupported image content type",
    );
  });
});

describe("createAvatarUploadTarget", () => {
  test("returns upload target metadata under the avatar prefix", async () => {
    const target = await createAvatarUploadTarget({
      userId: "user_123",
      contentType: "image/png",
      signUpload: async ({ objectKey, contentType }) => {
        return `https://upload.example/${objectKey}?contentType=${encodeURIComponent(contentType)}`;
      },
    });

    expect(target.objectKey).toMatch(
      /^profile\/avatars\/user_123\/[0-9a-f-]{36}\.png$/,
    );
    expect(target.publicUrl).toBe(
      `https://steve.haloworld.me/${target.objectKey}`,
    );
    expect(target.uploadUrl).toContain(target.objectKey);
  });
});

describe("createConversationImageUploadTarget", () => {
  test("returns upload target metadata under the conversation image prefix", async () => {
    const target = await createConversationImageUploadTarget({
      conversationId: "conversation_456",
      contentType: "image/webp",
      signUpload: async ({ objectKey, contentType }) => {
        return `https://upload.example/${objectKey}?contentType=${encodeURIComponent(contentType)}`;
      },
    });

    expect(target.objectKey).toMatch(
      /^conversation_media\/images\/conversation_456\/[0-9a-f-]{36}\.webp$/,
    );
    expect(target.publicUrl).toBe(
      `https://steve.haloworld.me/${target.objectKey}`,
    );
    expect(target.uploadUrl).toContain(target.objectKey);
  });
});

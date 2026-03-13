import {
  getBackfillableAvatarSourceUrl,
  getBackfillableImageSourceUrl,
  getLegacyImageUrl,
  pickResolvedUrl,
  resolveStoredAvatarUrl,
  resolveStoredImageUrl,
} from "../chatMediaHelpers";

describe("pickResolvedUrl", () => {
  test("prefers resolved storage url", () => {
    expect(pickResolvedUrl("https://fresh.example/a.png", "https://old.example/a.png")).toBe(
      "https://fresh.example/a.png",
    );
  });

  test("falls back to legacy url when storage url is missing", () => {
    expect(pickResolvedUrl(null, "https://old.example/a.png")).toBe(
      "https://old.example/a.png",
    );
  });
});

describe("getLegacyImageUrl", () => {
  test("extracts legacy image urls from prefixed text messages", () => {
    expect(getLegacyImageUrl("__IMAGE__:https://cdn.example/image.png")).toBe(
      "https://cdn.example/image.png",
    );
  });

  test("returns null for normal text messages", () => {
    expect(getLegacyImageUrl("hello")).toBeNull();
  });
});

describe("resolveStoredAvatarUrl", () => {
  test("prefers public url built from object key", () => {
    expect(
      resolveStoredAvatarUrl({
        objectKey: "profile/avatars/u1/avatar.jpg",
        resolvedStorageUrl: "https://convex.example/avatar.jpg",
        legacyUrl: "https://legacy.example/avatar.jpg",
      }),
    ).toBe("https://steve.haloworld.me/profile/avatars/u1/avatar.jpg");
  });

  test("falls back to resolved storage url when object key is missing", () => {
    expect(
      resolveStoredAvatarUrl({
        objectKey: null,
        resolvedStorageUrl: "https://convex.example/avatar.jpg",
        legacyUrl: "https://legacy.example/avatar.jpg",
      }),
    ).toBe("https://convex.example/avatar.jpg");
  });
});

describe("getBackfillableAvatarSourceUrl", () => {
  test("uses legacy avatarUrl when no object key exists", () => {
    expect(
      getBackfillableAvatarSourceUrl({
        objectKey: null,
        resolvedStorageUrl: null,
        legacyUrl: "https://legacy.example/avatar.jpg",
      }),
    ).toBe("https://legacy.example/avatar.jpg");
  });

  test("skips avatars that already have an object key", () => {
    expect(
      getBackfillableAvatarSourceUrl({
        objectKey: "profile/avatars/u1/avatar.jpg",
        resolvedStorageUrl: "https://convex.example/avatar.jpg",
        legacyUrl: "https://legacy.example/avatar.jpg",
      }),
    ).toBeNull();
  });
});

describe("resolveStoredImageUrl", () => {
  test("prefers public url built from object key", () => {
    expect(
      resolveStoredImageUrl({
        objectKey: "conversation_media/images/c1/pic.webp",
        resolvedStorageUrl: "https://convex.example/pic.webp",
        legacyContent: "__IMAGE__:https://legacy.example/pic.webp",
      }),
    ).toBe("https://steve.haloworld.me/conversation_media/images/c1/pic.webp");
  });

  test("falls back to legacy image url when no object key or storage url exists", () => {
    expect(
      resolveStoredImageUrl({
        objectKey: null,
        resolvedStorageUrl: null,
        legacyContent: "__IMAGE__:https://legacy.example/pic.webp",
      }),
    ).toBe("https://legacy.example/pic.webp");
  });
});

describe("getBackfillableImageSourceUrl", () => {
  test("uses legacy image url from message content when no object key exists", () => {
    expect(
      getBackfillableImageSourceUrl({
        objectKey: null,
        resolvedStorageUrl: null,
        legacyContent: "__IMAGE__:https://legacy.example/pic.webp",
      }),
    ).toBe("https://legacy.example/pic.webp");
  });

  test("skips images that already have an object key", () => {
    expect(
      getBackfillableImageSourceUrl({
        objectKey: "conversation_media/images/c1/pic.webp",
        resolvedStorageUrl: "https://convex.example/pic.webp",
        legacyContent: "__IMAGE__:https://legacy.example/pic.webp",
      }),
    ).toBeNull();
  });
});

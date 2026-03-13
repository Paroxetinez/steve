import { resolveCachedAvatarPhase } from "../cachedAvatarState";

describe("resolveCachedAvatarPhase", () => {
  test("returns image when the avatar URL is already cached", () => {
    expect(
      resolveCachedAvatarPhase({
        src: "https://steve.haloworld.me/profile/avatars/u1/avatar.jpg",
        loadedUrls: new Set(["https://steve.haloworld.me/profile/avatars/u1/avatar.jpg"]),
      }),
    ).toBe("image");
  });

  test("returns fallback for an unseen avatar URL", () => {
    expect(
      resolveCachedAvatarPhase({
        src: "https://steve.haloworld.me/profile/avatars/u2/avatar.jpg",
        loadedUrls: new Set(),
      }),
    ).toBe("fallback");
  });

  test("returns fallback for an empty avatar URL", () => {
    expect(
      resolveCachedAvatarPhase({
        src: "",
        loadedUrls: new Set(["https://steve.haloworld.me/profile/avatars/u1/avatar.jpg"]),
      }),
    ).toBe("fallback");
  });
});

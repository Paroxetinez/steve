import {
  buildSearchResultHref,
  resolveSeededSearchResult,
} from "../searchResultSeed";

describe("buildSearchResultHref", () => {
  test("includes userId nickname and avatarUrl in the search-result href", () => {
    expect(
      buildSearchResultHref({
        userId: "user_123",
        nickname: "Alice",
        avatarUrl: "https://steve.haloworld.me/profile/avatars/u1/avatar.jpg",
        includeConnected: true,
      }),
    ).toBe(
      "/search-result?userId=user_123&includeConnected=1&nickname=Alice&avatarUrl=https%3A%2F%2Fsteve.haloworld.me%2Fprofile%2Favatars%2Fu1%2Favatar.jpg",
    );
  });
});

describe("resolveSeededSearchResult", () => {
  test("returns a seeded user object when params are present", () => {
    expect(
      resolveSeededSearchResult({
        userId: "user_123",
        nickname: "Alice",
        avatarUrl: "https://steve.haloworld.me/profile/avatars/u1/avatar.jpg",
      }),
    ).toEqual({
      userId: "user_123",
      nickname: "Alice",
      avatarUrl: "https://steve.haloworld.me/profile/avatars/u1/avatar.jpg",
      compatibility: [],
      displayId: "-",
      isConnected: false,
    });
  });

  test("returns null when userId is missing", () => {
    expect(
      resolveSeededSearchResult({
        userId: null,
        nickname: "Alice",
        avatarUrl: "https://steve.haloworld.me/profile/avatars/u1/avatar.jpg",
      }),
    ).toBeNull();
  });
});

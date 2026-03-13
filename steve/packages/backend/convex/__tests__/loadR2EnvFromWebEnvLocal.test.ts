const {
  applyMissingR2EnvFromText,
} = require("../../../../scripts/lib/load-r2-env-from-web.js");

describe("applyMissingR2EnvFromText", () => {
  test("loads missing R2 variables from env text", () => {
    const env = {};

    applyMissingR2EnvFromText(
      env,
      [
        "NEXT_PUBLIC_CONVEX_URL=https://example.convex.cloud",
        "R2_ACCOUNT_ID=account_123",
        "R2_BUCKET_NAME=steve",
        "R2_ACCESS_KEY_ID=access_123",
        "R2_SECRET_ACCESS_KEY=secret_123",
        "R2_PUBLIC_BASE_URL=https://steve.haloworld.me",
      ].join("\n"),
    );

    expect(env).toMatchObject({
      R2_ACCOUNT_ID: "account_123",
      R2_BUCKET_NAME: "steve",
      R2_ACCESS_KEY_ID: "access_123",
      R2_SECRET_ACCESS_KEY: "secret_123",
      R2_PUBLIC_BASE_URL: "https://steve.haloworld.me",
    });
  });

  test("does not override already present R2 variables", () => {
    const env = {
      R2_ACCOUNT_ID: "already_set",
    };

    applyMissingR2EnvFromText(
      env,
      [
        "R2_ACCOUNT_ID=from_file",
        "R2_BUCKET_NAME=steve",
      ].join("\n"),
    );

    expect(env).toMatchObject({
      R2_ACCOUNT_ID: "already_set",
      R2_BUCKET_NAME: "steve",
    });
  });
});

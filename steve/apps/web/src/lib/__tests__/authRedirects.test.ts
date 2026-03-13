import {
  AUTHENTICATED_HOME_PATH,
  buildInstallAppPath,
  resolveInstallAppNextPath,
  resolvePostAuthPath,
} from "../authRedirects";

describe("authRedirects", () => {
  test("routes authenticated users to inbox", () => {
    expect(resolvePostAuthPath(true)).toBe(AUTHENTICATED_HOME_PATH);
    expect(resolvePostAuthPath(false)).toBe("/profile");
  });

  test("falls back to inbox when install next path is missing", () => {
    expect(resolveInstallAppNextPath(null)).toBe(AUTHENTICATED_HOME_PATH);
    expect(resolveInstallAppNextPath("")).toBe(AUTHENTICATED_HOME_PATH);
    expect(resolveInstallAppNextPath("/chat")).toBe("/chat");
  });

  test("builds install-app href with encoded next path", () => {
    expect(buildInstallAppPath()).toBe("/install-app?next=%2Finbox");
    expect(buildInstallAppPath("/chat?conversationId=123")).toBe(
      "/install-app?next=%2Fchat%3FconversationId%3D123",
    );
  });
});

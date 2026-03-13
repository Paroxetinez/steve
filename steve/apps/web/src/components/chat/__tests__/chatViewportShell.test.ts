import { getChatViewportShellClassName } from "../chatViewportShell";

describe("getChatViewportShellClassName", () => {
  test("uses a dynamic viewport height shell instead of a small viewport shell", () => {
    const className = getChatViewportShellClassName();

    expect(className).toContain("h-dvh");
    expect(className).not.toContain("h-svh");
  });
});

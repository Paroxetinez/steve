import { resolveAppShellLayout } from "../appShellLayout";

describe("resolveAppShellLayout", () => {
  test("adds bottom padding and fixed nav wrapper when bottom nav is enabled", () => {
    expect(resolveAppShellLayout(true)).toEqual({
      contentClassName: "min-h-0 flex-1 pb-[calc(76px+env(safe-area-inset-bottom))]",
      navWrapperClassName:
        "fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80",
    });
  });

  test("leaves content unpadded and nav wrapper empty when bottom nav is disabled", () => {
    expect(resolveAppShellLayout(false)).toEqual({
      contentClassName: "min-h-0 flex-1",
      navWrapperClassName: "",
    });
  });
});

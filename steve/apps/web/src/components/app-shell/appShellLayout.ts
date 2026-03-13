export function resolveAppShellLayout(withBottomNav: boolean) {
  if (!withBottomNav) {
    return {
      contentClassName: "min-h-0 flex-1",
      navWrapperClassName: "",
    };
  }

  return {
    contentClassName: "min-h-0 flex-1 pb-[calc(76px+env(safe-area-inset-bottom))]",
    navWrapperClassName:
      "fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80",
  };
}

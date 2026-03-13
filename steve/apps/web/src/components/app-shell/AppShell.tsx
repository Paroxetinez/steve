"use client";

import BottomNav from "@/components/app-nav/BottomNav";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { resolveAppShellLayout } from "./appShellLayout";

type AppShellProps = {
  children: ReactNode;
  withBottomNav?: boolean;
  contentClassName?: string;
};

export default function AppShell({
  children,
  withBottomNav = true,
  contentClassName,
}: AppShellProps) {
  const layout = resolveAppShellLayout(withBottomNav);

  return (
    <main className="min-h-screen bg-white">
      <div className={cn("flex min-h-screen flex-col", contentClassName)}>
        <div className={layout.contentClassName}>{children}</div>
        {withBottomNav ? (
          <div className={layout.navWrapperClassName}>
            <BottomNav />
          </div>
        ) : null}
      </div>
    </main>
  );
}

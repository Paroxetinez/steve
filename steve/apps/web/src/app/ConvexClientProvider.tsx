"use client";

import { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ErrorBoundary } from "./ErrorBoundary";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  if (!convex) {
    return <>{children}</>;
  }

  return (
    <ErrorBoundary>
      <ConvexProvider client={convex}>{children}</ConvexProvider>
    </ErrorBoundary>
  );
}

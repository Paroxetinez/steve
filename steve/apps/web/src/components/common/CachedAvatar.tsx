"use client";

import { cn } from "@/lib/utils";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { resolveCachedAvatarPhase } from "./cachedAvatarState";

const loadedAvatarUrls = new Set<string>();
const pendingAvatarLoads = new Map<string, Promise<void>>();

function normalizeSrc(src: string | null | undefined) {
  return src?.trim() ?? "";
}

function preloadAvatar(src: string) {
  const existing = pendingAvatarLoads.get(src);
  if (existing) {
    return existing;
  }

  const pending = new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      loadedAvatarUrls.add(src);
      pendingAvatarLoads.delete(src);
      resolve();
    };
    image.onerror = () => {
      pendingAvatarLoads.delete(src);
      reject(new Error(`Failed to preload avatar: ${src}`));
    };
    image.src = src;
  });

  pendingAvatarLoads.set(src, pending);
  return pending;
}

type CachedAvatarProps = {
  src?: string | null;
  alt: string;
  fallback: ReactNode;
  className?: string;
  imgClassName?: string;
  fallbackClassName?: string;
};

export function CachedAvatar({
  src,
  alt,
  fallback,
  className,
  imgClassName,
  fallbackClassName,
}: CachedAvatarProps) {
  const normalizedSrc = useMemo(() => normalizeSrc(src), [src]);
  const [phase, setPhase] = useState(() =>
    resolveCachedAvatarPhase({
      src: normalizedSrc,
      loadedUrls: loadedAvatarUrls,
    }),
  );

  useEffect(() => {
    const nextPhase = resolveCachedAvatarPhase({
      src: normalizedSrc,
      loadedUrls: loadedAvatarUrls,
    });
    setPhase(nextPhase);

    if (!normalizedSrc || nextPhase === "image") {
      return;
    }

    let cancelled = false;
    preloadAvatar(normalizedSrc)
      .then(() => {
        if (!cancelled) {
          setPhase("image");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPhase("fallback");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [normalizedSrc]);

  return (
    <div className={cn("overflow-hidden", className)}>
      {phase === "image" && normalizedSrc ? (
        <img
          src={normalizedSrc}
          alt={alt}
          className={cn("h-full w-full object-cover", imgClassName)}
        />
      ) : (
        <div
          className={cn(
            "grid h-full w-full place-items-center bg-gray-200 text-gray-600",
            fallbackClassName,
          )}
        >
          {fallback}
        </div>
      )}
    </div>
  );
}

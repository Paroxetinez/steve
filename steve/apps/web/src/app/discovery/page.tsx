"use client";

import AppShell from "@/components/app-shell/AppShell";
import { useI18n } from "@/lib/i18n";
import { Heart, X } from "lucide-react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useRef, useState } from "react";

const SWIPE_TRIGGER_PX = 90;
const SWIPE_EXIT_PX = 560;
const SWIPE_ANIMATION_MS = 220;

export default function DiscoveryPage() {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right">("right");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [disableTransition, setDisableTransition] = useState(false);
  const [dragX, setDragX] = useState(0);
  const startXRef = useRef(0);
  const activePointerIdRef = useRef<number | null>(null);

  const questions = t.discovery.questions;

  function handleSwipe(direction: "left" | "right") {
    if (isAnimating) return;
    setDisableTransition(false);
    setIsDragging(false);
    setExitDirection(direction);
    setDragX(direction === "right" ? SWIPE_TRIGGER_PX : -SWIPE_TRIGGER_PX);
    setIsAnimating(true);

    window.setTimeout(() => {
      // Reset card position without transition to avoid any "return" animation.
      setDisableTransition(true);
      setIndex((prev) => (prev + 1) % questions.length);
      setDragX(0);
      setIsAnimating(false);
      window.requestAnimationFrame(() => {
        setDisableTransition(false);
      });
    }, SWIPE_ANIMATION_MS);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (isAnimating) return;
    activePointerIdRef.current = event.pointerId;
    startXRef.current = event.clientX;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDragging || activePointerIdRef.current !== event.pointerId || isAnimating) return;
    setDragX(event.clientX - startXRef.current);
  }

  function handlePointerRelease(event: ReactPointerEvent<HTMLDivElement>) {
    if (activePointerIdRef.current !== event.pointerId) return;
    activePointerIdRef.current = null;
    handleSwipe(dragX < 0 ? "left" : "right");
  }

  const dragRatio = Math.max(-1, Math.min(1, dragX / 160));
  const liveRotate = dragRatio * 9;
  const liveScale = isDragging ? 0.995 : 1;
  const exitX = exitDirection === "right" ? SWIPE_EXIT_PX : -SWIPE_EXIT_PX;
  const rightStampOpacity = Math.max(0, Math.min(1, dragX / 120));
  const leftStampOpacity = Math.max(0, Math.min(1, -dragX / 120));
  const swipeProgress = isAnimating
    ? 1
    : Math.max(0, Math.min(1, Math.abs(dragX) / SWIPE_TRIGGER_PX));
  const currentQuestion = questions[index];
  const nextQuestion = questions[(index + 1) % questions.length];

  return (
    <AppShell>
      <div className="flex h-full flex-col items-center justify-center px-6 pt-6">
        <div
          className="relative mb-8 w-full max-w-[22rem] aspect-[3/4]"
          style={{ perspective: "1000px" }}
        >
          <div className="pointer-events-none absolute inset-0 translate-y-2 scale-[0.97] rounded-[28px] bg-gradient-to-br from-[#4f5369]/50 via-[#3d4258]/40 to-[#2e3245]/50 blur-[1px]" />
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[28px] border border-[#8c96b5]/25"
            style={{
              transform: `translateY(${14 - swipeProgress * 14}px) scale(${0.94 + swipeProgress * 0.06})`,
              opacity: 0.72 + swipeProgress * 0.28,
              transition: isDragging || disableTransition
                ? "none"
                : "transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease",
              background:
                "linear-gradient(155deg, #4e5368 0%, #43495e 42%, #373c50 74%, #303446 100%)",
              boxShadow: "0 20px 40px rgba(18, 22, 36, 0.2)",
            }}
          >
            <div
              className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full blur-[46px]"
              style={{
                background:
                  "radial-gradient(circle, rgba(247, 236, 194, 0.72) 0%, rgba(247, 236, 194, 0.26) 42%, rgba(247, 236, 194, 0) 76%)",
              }}
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 48%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.08) 26%, rgba(255,255,255,0) 62%)",
              }}
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 28%, rgba(0,0,0,0.16) 100%)",
              }}
            />
            <h2 className="relative z-10 flex h-full items-center justify-center px-8 text-center text-[30px] font-bold leading-tight text-white/85 drop-shadow-[0_2px_12px_rgba(0,0,0,0.18)]">
              {nextQuestion}
            </h2>
          </div>

          <div
            className={`absolute inset-0 z-10 touch-pan-y overflow-hidden rounded-[28px] border border-[#8c96b5]/35 ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerRelease}
            onPointerCancel={handlePointerRelease}
            style={{
              transform: isAnimating
                ? `translateX(${exitX}px) rotate(${exitDirection === "right" ? 16 : -16}deg) scale(0.96)`
                : `translateX(${dragX}px) rotate(${liveRotate}deg) scale(${liveScale})`,
              opacity: isAnimating ? 0 : 1,
              transition: isDragging || disableTransition
                ? "none"
                : "transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease",
              background:
                "linear-gradient(155deg, #4e5368 0%, #43495e 42%, #373c50 74%, #303446 100%)",
              boxShadow:
                "0 32px 64px rgba(18, 22, 36, 0.28), 0 10px 28px rgba(18, 22, 36, 0.22)",
            }}
          >
            <div
              className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full blur-[46px]"
              style={{
                background:
                  "radial-gradient(circle, rgba(247, 236, 194, 0.85) 0%, rgba(247, 236, 194, 0.35) 42%, rgba(247, 236, 194, 0) 76%)",
              }}
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 48%, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.12) 26%, rgba(255,255,255,0) 62%)",
              }}
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 28%, rgba(0,0,0,0.16) 100%)",
              }}
            />

            <div
              className="absolute left-5 top-5 rounded-full border border-[#f25d6a]/50 bg-[#f25d6a]/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#ffd4d8]"
              style={{ opacity: leftStampOpacity }}
            >
              Nope
            </div>
            <div
              className="absolute right-5 top-5 rounded-full border border-[#5ce08d]/50 bg-[#5ce08d]/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d5ffe4]"
              style={{ opacity: rightStampOpacity }}
            >
              I can
            </div>

            <h2 className="relative z-10 flex h-full items-center justify-center px-8 text-center text-[30px] font-bold leading-tight text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.22)]">
              {currentQuestion}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-14">
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => handleSwipe("left")}
              className="grid size-14 place-items-center rounded-full border border-black/5 bg-white text-black shadow-[0_8px_22px_rgba(20,24,40,0.14)] transition-transform hover:scale-105 active:scale-95"
            >
              <X className="size-7" strokeWidth={3} />
            </button>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-black/75">
              Hell no
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => handleSwipe("right")}
              className="grid size-14 place-items-center rounded-full border border-black/5 bg-white text-[#ff345d] shadow-[0_8px_22px_rgba(20,24,40,0.14)] transition-transform hover:scale-105 active:scale-95"
            >
              <Heart className="size-7" fill="currentColor" />
            </button>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-black/75">
              I can
            </span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

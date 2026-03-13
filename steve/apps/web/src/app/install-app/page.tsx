"use client";

import AppShell from "@/components/app-shell/AppShell";
import { resolveInstallAppNextPath } from "@/lib/authRedirects";
import { useI18n } from "@/lib/i18n";
import { Download, Smartphone } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  const iosStandalone =
    typeof (window.navigator as Navigator & { standalone?: boolean }).standalone === "boolean" &&
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
  const displayModeStandalone = window.matchMedia("(display-mode: standalone)").matches;
  return iosStandalone || displayModeStandalone;
}

function InstallAppPageContent() {
  const { language } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  const nextPath = useMemo(
    () => resolveInstallAppNextPath(searchParams.get("next")),
    [searchParams],
  );
  const isZh = language === "zh";

  useEffect(() => {
    if (isStandaloneMode()) {
      router.replace(nextPath);
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      router.replace(nextPath);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [nextPath, router]);

  async function handleInstall() {
    if (!deferredPrompt) return;

    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choice.outcome === "accepted") {
        router.replace(nextPath);
      }
    } catch (error) {
      console.error("PWA install prompt failed:", error);
    } finally {
      setInstalling(false);
    }
  }

  function handleSkip() {
    router.replace(nextPath);
  }

  return (
    <AppShell withBottomNav={false}>
      <div className="flex h-full min-h-0 flex-col bg-white px-6 py-8">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          <div className="mb-6 flex items-center justify-center">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-black text-white">
              <Smartphone className="size-10" />
            </div>
          </div>

          <h1 className="text-center text-2xl font-bold text-black">
            {isZh ? "安装 Steve App" : "Install Steve App"}
          </h1>
          <p className="mt-3 text-center text-sm leading-6 text-gray-500">
            {isZh
              ? "资料已完成。建议把 Steve 安装到手机桌面，打开更快、使用更像原生 App。"
              : "Profile completed. Install Steve to your home screen for a faster app-like experience."}
          </p>

          <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            {deferredPrompt ? (
              <p className="text-sm text-gray-700">
                {isZh
                  ? "你的浏览器支持一键安装，点击下方按钮即可。"
                  : "Your browser supports one-tap install. Use the button below."}
              </p>
            ) : (
              <div className="space-y-3 text-sm text-gray-700">
                <p>
                  {isZh
                    ? "如果没有弹出安装按钮，也可以手动添加到主屏幕："
                    : "If the install button is unavailable, you can still add it manually:"}
                </p>
                <p>
                  {isZh
                    ? "iPhone (Safari)：点底部“分享” -> “添加到主屏幕”"
                    : "iPhone (Safari): Share -> Add to Home Screen"}
                </p>
                <p>
                  {isZh
                    ? "Android (Chrome)：右上角菜单 -> “安装应用”/“添加到主屏幕”"
                    : "Android (Chrome): Menu -> Install app / Add to Home screen"}
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={deferredPrompt ? handleInstall : handleSkip}
              disabled={installing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-black py-4 font-medium text-white disabled:opacity-50"
            >
              <Download className="size-4" />
              {installing
                ? isZh
                  ? "安装中..."
                  : "Installing..."
                : deferredPrompt
                  ? isZh
                    ? "立即安装"
                    : "Install Now"
                  : isZh
                    ? "继续进入收件箱"
                    : "Continue to Inbox"}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="w-full rounded-xl border border-gray-200 py-4 font-medium text-gray-700"
            >
              {isZh ? "稍后再说" : "Maybe Later"}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default function InstallAppPage() {
  return (
    <Suspense fallback={null}>
      <InstallAppPageContent />
    </Suspense>
  );
}

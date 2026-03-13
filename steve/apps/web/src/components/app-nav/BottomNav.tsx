"use client";

import { useI18n } from "@/lib/i18n";
import { useSessionToken } from "@/lib/session-token-context";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { MessageCircle, Sparkles, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export default function BottomNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const { sessionToken } = useSessionToken();
  const unreadSummary = useQuery(
    api.chatConversations.getUnreadConversationCount,
    sessionToken ? { sessionToken } : "skip",
  );

  const unreadCount = useMemo(() => unreadSummary?.unreadCount ?? 0, [unreadSummary]);

  const items = [
    { href: "/inbox", label: t.nav.inbox, icon: MessageCircle },
    { href: "/discovery", label: t.nav.discovery, icon: Sparkles },
    { href: "/add-friends", label: t.nav.friends, icon: Users },
    { href: "/personal-profile", label: t.nav.profile, icon: User },
  ];

  return (
    <div className="px-6 py-3">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || (item.href === "/inbox" && pathname.startsWith("/chat"));
          const showUnreadBadge = item.href === "/inbox" && unreadCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-1 p-2"
            >
              <Icon
                className={`size-6 ${active ? "text-black" : "text-gray-300"}`}
                strokeWidth={2}
                fill={active ? "currentColor" : "none"}
              />
              {showUnreadBadge ? (
                <span className="absolute right-1 top-1 min-w-4 rounded-full bg-black px-1 text-center text-[10px] leading-4 text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
              <span className={`text-[10px] ${active ? "text-black" : "text-gray-400"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

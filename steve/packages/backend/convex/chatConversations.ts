import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { requireUserBySession } from "./authUtils";
import { resolveStoredAvatarUrl } from "./chatMediaHelpers";
import { filterDiscoverUsers } from "./chatConversationHelpers";
import { sumUnreadConversationCounts } from "./chatConversationUnreadCount";

const JOE_PHONE = "18106289189";
const JOE_FOUNDER_LABEL = "Joe（创始人）";
const EXCLUDED_FAKE_PHONES = new Set(["16600000001", "16600000002"]);
const EXCLUDED_FAKE_NICKNAMES = new Set(["alice", "charlie"]);
const REPORT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

type ReportMilestoneTag =
  | "milestone_offline_meetup"
  | "milestone_crisis_resolved"
  | "milestone_relationship_warming";

function detectReportMilestoneTag(content: string): ReportMilestoneTag | null {
  if (!content.trim()) return null;

  if (
    /(meet|offline|date|coffee|dinner|lunch|movie|park|exhibition|线下|见面|约会|喝咖啡|吃饭|看电影)/i.test(
      content,
    )
  ) {
    return "milestone_offline_meetup";
  }

  if (
    /(resolved|reconcile|made up|sorry|apolog|misunderstanding|conflict solved|和好|误会解开|道歉|缓和|危机解除)/i.test(
      content,
    )
  ) {
    return "milestone_crisis_resolved";
  }

  if (
    /(miss you|like you|good night|good morning|cant wait|can't wait|心动|喜欢你|想你|晚安|早安|想见你)/i.test(
      content,
    )
  ) {
    return "milestone_relationship_warming";
  }

  return null;
}

type UiLanguage = "en" | "zh";

function maskPhone(phone: string) {
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

function buildCompatibilityLines(
  myProfile: { city: string; gender: string; birthday: string } | null,
  targetProfile: { city: string; gender: string; birthday: string },
  language: UiLanguage,
) {
  const lines: string[] = [];
  const isZh = language === "zh";

  if (myProfile?.city && targetProfile.city && myProfile.city === targetProfile.city) {
    lines.push(isZh ? `你们都在${targetProfile.city}，线下见面更方便。` : `Both in ${targetProfile.city}.`);
  }

  if (myProfile?.birthday && targetProfile.birthday) {
    const myYear = Number(myProfile.birthday.split("-")[0]);
    const targetYear = Number(targetProfile.birthday.split("-")[0]);
    if (Number.isFinite(myYear) && Number.isFinite(targetYear) && Math.abs(myYear - targetYear) <= 3) {
      lines.push(
        isZh
          ? "年龄差距较小，生活节奏可能更容易对上。"
          : "Close age range, easier to align routines.",
      );
    }
  }

  if (myProfile?.gender && targetProfile.gender && myProfile.gender === targetProfile.gender) {
    lines.push(
      isZh
        ? "沟通风格可能更接近，前期聊天更容易破冰。"
        : "Likely to share similar communication style.",
    );
  }

  if (lines.length === 0) {
    if (isZh) {
      lines.push("是一次新的连接机会。");
      lines.push("可以先从轻松话题开始聊天。");
      lines.push("表达清晰、真诚一点会更加分。");
    } else {
      lines.push("New connection opportunity.");
      lines.push("Start with light conversation topics.");
      lines.push("Be clear and respectful in communication.");
    }
  }

  return lines.slice(0, 3);
}

async function resolveAvatarUrl(
  ctx: QueryCtx,
  profile: Doc<"profiles"> | null,
) {
  return resolveStoredAvatarUrl({
    objectKey: profile?.avatarObjectKey,
    resolvedStorageUrl: profile?.avatarStorageId
      ? await ctx.storage.getUrl(profile.avatarStorageId)
      : null,
    legacyUrl: profile?.avatarUrl,
  });
}

async function findExistingDirectConversationId(
  ctx: MutationCtx,
  currentUserId: Id<"users">,
  targetUserId: Id<"users">,
) {
  const memberships = await ctx.db
    .query("conversationMembers")
    .withIndex("by_userId", (q) => q.eq("userId", currentUserId))
    .collect();

  for (const membership of memberships) {
    const conversation = await ctx.db.get(membership.conversationId);
    if (!conversation || conversation.type !== "direct") continue;

    const targetMembership = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId_userId", (q) =>
        q.eq("conversationId", conversation._id).eq("userId", targetUserId),
      )
      .unique();

    if (targetMembership) {
      return conversation._id;
    }
  }

  return null;
}

export const listMyConversations = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const { user } = await requireUserBySession(ctx, args.sessionToken);

      const memberships = await ctx.db
        .query("conversationMembers")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();

      const conversations = await Promise.all(
        memberships.map(async (membership) => {
          const conversation = await ctx.db.get(membership.conversationId);
          if (!conversation) return null;

          const unreadMessages = await ctx.db
            .query("messages")
            .withIndex("by_conversationId_createdAt", (q) =>
              q
                .eq("conversationId", conversation._id)
                .gt("createdAt", membership.lastReadAt ?? 0),
            )
            .collect();

          const rawSubtitle = conversation.lastMessagePreview?.trim() ?? "";
          const subtitle = rawSubtitle.startsWith("__STEVE_SCORE__:") ? "" : rawSubtitle;
          let name =
            conversation.type === "assistant"
              ? "Steve Assistant"
              : conversation.title ?? "Conversation";
          let avatarUrl: string | undefined;
          let targetUserId: Id<"users"> | undefined;

          if (conversation.type === "direct") {
            const members = await ctx.db
              .query("conversationMembers")
              .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
              .collect();
            const otherMember = members.find((m) => m.userId !== user._id);
            if (otherMember) {
              targetUserId = otherMember.userId;
              const otherUser = await ctx.db.get(otherMember.userId);
              const otherProfile = await ctx.db
                .query("profiles")
                .withIndex("by_userId", (q) => q.eq("userId", otherMember.userId))
                .unique();
              avatarUrl = (await resolveAvatarUrl(ctx, otherProfile)) ?? undefined;
              if (otherUser?.phone === JOE_PHONE) {
                name = JOE_FOUNDER_LABEL;
              } else {
                if (otherProfile?.nickname) {
                  name = otherProfile.nickname;
                } else if (otherUser?.phone) {
                  name = `User ${maskPhone(otherUser.phone)}`;
                }
              }
            }
          }

          return {
            id: conversation._id,
            type: conversation.type,
            name,
            subtitle,
            unread: unreadMessages.filter((message) => message.senderType !== "system").length,
            online: conversation.type === "assistant",
            updatedAt: conversation.updatedAt,
            avatarUrl,
            targetUserId,
          };
        }),
      );

      return conversations
        .filter((item): item is NonNullable<typeof item> => !!item)
        .sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.error("Error in listMyConversations:", error);
      throw error;
    }
  },
});

export const discoverUsers = query({
  args: {
    sessionToken: v.string(),
    keyword: v.optional(v.string()),
    language: v.optional(v.union(v.literal("en"), v.literal("zh"))),
    includeConnected: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserBySession(ctx, args.sessionToken);
    const language: UiLanguage = args.language ?? "en";

    const myProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    const myMemberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const directConversationByUserId = new Map<string, Id<"conversations">>();

    for (const membership of myMemberships) {
      const conversation = await ctx.db.get(membership.conversationId);
      if (!conversation || conversation.type !== "direct") continue;

      const members = await ctx.db
        .query("conversationMembers")
        .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
        .collect();

      const other = members.find((member) => member.userId !== user._id);
      if (other) {
        directConversationByUserId.set(String(other.userId), conversation._id);
      }
    }

    const keyword = args.keyword?.trim().toLowerCase() ?? "";
    const profiles = await ctx.db.query("profiles").collect();

    const results = await Promise.all(
      profiles
        .filter((profile) => profile.userId !== user._id)
        .map(async (profile) => {
          const targetUser = await ctx.db.get(profile.userId);
          if (!targetUser || targetUser.status !== "active") return null;
          if (EXCLUDED_FAKE_PHONES.has(targetUser.phone)) return null;
          if (EXCLUDED_FAKE_NICKNAMES.has(profile.nickname.trim().toLowerCase())) return null;

          const conversationId = directConversationByUserId.get(String(profile.userId));
          const searchText = `${profile.nickname} ${profile.city} ${targetUser.phone}`.toLowerCase();

          if (keyword && !searchText.includes(keyword)) {
            return null;
          }

          return {
            userId: profile.userId,
            nickname: profile.nickname,
            city: profile.city,
            gender: profile.gender,
            birthday: profile.birthday,
            avatarUrl: (await resolveAvatarUrl(ctx, profile)) ?? undefined,
            displayId: maskPhone(targetUser.phone),
            isConnected: !!conversationId,
            conversationId,
            compatibility: buildCompatibilityLines(
              myProfile
                ? {
                    city: myProfile.city,
                    gender: myProfile.gender,
                    birthday: myProfile.birthday,
                  }
                : null,
              {
                city: profile.city,
                gender: profile.gender,
                birthday: profile.birthday,
              },
              language,
            ),
          };
        }),
    );

    return filterDiscoverUsers(
      results
        .filter((item): item is NonNullable<typeof item> => !!item)
        .sort((a, b) => Number(a.isConnected) - Number(b.isConnected)),
      args.includeConnected ?? false,
    );
  },
});

export const getUnreadConversationCount = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserBySession(ctx, args.sessionToken);

    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const unreadCounts = await Promise.all(
      memberships.map(async (membership) => {
        const unreadMessages = await ctx.db
          .query("messages")
          .withIndex("by_conversationId_createdAt", (q) =>
            q
              .eq("conversationId", membership.conversationId)
              .gt("createdAt", membership.lastReadAt ?? 0),
          )
          .collect();

        return unreadMessages.filter((message) => message.senderType !== "system").length;
      }),
    );

    return {
      unreadCount: sumUnreadConversationCounts(unreadCounts),
    };
  },
});

export const createDirectConversationWithUser = mutation({
  args: {
    sessionToken: v.string(),
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserBySession(ctx, args.sessionToken);
    if (user._id === args.targetUserId) {
      throw new Error("Cannot add yourself");
    }

    const targetUser = await ctx.db.get(args.targetUserId);
    if (!targetUser || targetUser.status !== "active") {
      throw new Error("User not found");
    }

    const existingId = await findExistingDirectConversationId(ctx, user._id, args.targetUserId);
    if (existingId) {
      return { conversationId: existingId, alreadyExists: true };
    }

    const targetProfile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .unique();

    const now = Date.now();
    const title = targetProfile?.nickname ?? `User ${maskPhone(targetUser.phone)}`;

    const conversationId = await ctx.db.insert("conversations", {
      type: "direct",
      title,
      createdByUserId: user._id,
      lastMessagePreview: "Say hi and start your conversation.",
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: user._id,
      role: "owner",
      joinedAt: now,
      lastReadAt: now,
    });

    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: args.targetUserId,
      role: "member",
      joinedAt: now,
      lastReadAt: now,
    });

    return { conversationId, alreadyExists: false };
  },
});

export const getMyReport = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserBySession(ctx, args.sessionToken);
    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    const reportEvents: Array<{
      conversationId: Id<"conversations">;
      title: string;
      preview: string;
      updatedAt: number;
      tag: ReportMilestoneTag;
    }> = [];
    const processedConversationIds = new Set<string>();

    for (const membership of memberships) {
      if (processedConversationIds.has(String(membership.conversationId))) {
        continue;
      }
      processedConversationIds.add(String(membership.conversationId));

      const conversation = await ctx.db.get(membership.conversationId);
      if (!conversation || conversation.type !== "direct") continue;

      const members = await ctx.db
        .query("conversationMembers")
        .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
        .collect();
      const otherMember = members.find((item) => item.userId !== user._id);
      if (!otherMember) continue;

      const otherUser = await ctx.db.get(otherMember.userId);
      if (!otherUser) continue;
      if (otherUser.phone === user.phone) continue;

      let reportTitle = conversation.title ?? "Conversation";
      if (otherUser.phone === JOE_PHONE) {
        reportTitle = JOE_FOUNDER_LABEL;
      } else {
        const otherProfile = await ctx.db
          .query("profiles")
          .withIndex("by_userId", (q) => q.eq("userId", otherMember.userId))
          .unique();
        if (otherProfile?.nickname) {
          reportTitle = otherProfile.nickname;
        } else {
          reportTitle = `User ${maskPhone(otherUser.phone)}`;
        }
      }

      const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversationId_createdAt", (q) =>
          q.eq("conversationId", conversation._id),
        )
        .collect();

      const lastTriggeredAtByTag = new Map<ReportMilestoneTag, number>();
      for (const message of messages) {
        if (message.senderType !== "user") continue;
        const milestoneTag = detectReportMilestoneTag(message.content);
        if (!milestoneTag) continue;

        const lastTriggeredAt = lastTriggeredAtByTag.get(milestoneTag) ?? 0;
        if (message.createdAt - lastTriggeredAt < REPORT_COOLDOWN_MS) {
          continue;
        }

        lastTriggeredAtByTag.set(milestoneTag, message.createdAt);
        reportEvents.push({
          conversationId: conversation._id,
          title: reportTitle,
          preview: message.content.slice(0, 120),
          updatedAt: message.createdAt,
          tag: milestoneTag,
        });
      }
    }

    const totalAssists = reportEvents.length;
    const icebreaks = reportEvents.filter(
      (item) => item.tag === "milestone_relationship_warming",
    ).length;
    const offlineMeetups = reportEvents.filter(
      (item) => item.tag === "milestone_offline_meetup",
    ).length;

    const sortedHighlights = reportEvents
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 3);

    return {
      stats: {
        totalAssists,
        icebreaks,
        offlineMeetups,
      },
      highlights: sortedHighlights,
    };
  },
});

export const getOrCreateAssistantConversation = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserBySession(ctx, args.sessionToken);
    const now = Date.now();

    const memberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();

    for (const membership of memberships) {
      const existingConversation = await ctx.db.get(membership.conversationId);
      if (existingConversation?.type === "assistant") {
        return { id: existingConversation._id };
      }
    }

    const conversationId = await ctx.db.insert("conversations", {
      type: "assistant",
      title: "Steve Assistant",
      createdByUserId: user._id,
      lastMessagePreview: "Hello, I am Steve. How can I help you today?",
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("conversationMembers", {
      conversationId,
      userId: user._id,
      role: "owner",
      joinedAt: now,
      lastReadAt: now,
    });

    await ctx.db.insert("messages", {
      conversationId,
      senderType: "assistant",
      content: "Hello, I am Steve. How can I help you today?",
      contentType: "text",
      createdAt: now,
    });

    return { id: conversationId };
  },
});

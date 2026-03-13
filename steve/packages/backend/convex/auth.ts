import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { ConvexError, v } from "convex/values";
import {
  buildSessionExpiresAt,
  createSessionToken,
  hashPassword,
  isValidPhone,
  normalizePhone,
  requireUserBySession,
  sha256Hex,
} from "./authUtils";
import { resolveStoredAvatarUrl } from "./chatMediaHelpers";

type DemoScriptLine = {
  speaker: "self" | "contact" | "assistant";
  content: string;
  gapMs?: number;
};

type DemoContact = {
  phone: string;
  nickname: string;
  city: string;
  script: DemoScriptLine[];
};

function throwAuthError(message: string): never {
  throw new ConvexError(message);
}

const DEMO_CONTACTS: DemoContact[] = [
  {
    phone: "18106289189",
    nickname: "Joe（创始人）",
    city: "Beijing",
    script: [
      { speaker: "assistant", content: "Hi, I am Steve, your dating assistant." },
      { speaker: "assistant", content: "Joe is one of Steve creators." },
      { speaker: "assistant", content: "I can help you chat better." },
    ],
  },
];
const LEGACY_DEMO_PHONES = ["16600000001", "16600000002"];
async function ensureProfile(
  ctx: MutationCtx,
  userId: Id<"users">,
  nickname: string,
  city: string,
) {
  const existing = await ctx.db
    .query("profiles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();

  if (existing) return;

  await ctx.db.insert("profiles", {
    userId,
    nickname,
    gender: "other",
    birthday: "1999-01-01",
    city,
    updatedAt: Date.now(),
  });
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

async function getOrCreateDemoUser(
  ctx: MutationCtx,
  phone: string,
  nickname: string,
  city: string,
): Promise<Id<"users">> {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_phone", (q) => q.eq("phone", phone))
    .unique();

  if (existing) {
    await ensureProfile(ctx, existing._id, nickname, city);
    return existing._id;
  }

  const now = Date.now();
  const passwordSalt = createSessionToken();
  const passwordHash = await hashPassword("demo123456", passwordSalt);
  const userId = await ctx.db.insert("users", {
    phone,
    passwordHash,
    passwordSalt,
    status: "active",
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  });

  await ensureProfile(ctx, userId, nickname, city);
  return userId;
}

async function getDirectConversationsBetweenUsers(
  ctx: MutationCtx,
  currentUserId: Id<"users">,
  otherUserId: Id<"users">,
) {
  const memberships = await ctx.db
    .query("conversationMembers")
    .withIndex("by_userId", (q) => q.eq("userId", currentUserId))
    .collect();

  const result: Array<{ id: Id<"conversations">; updatedAt: number }> = [];

  for (const membership of memberships) {
    const conversation = await ctx.db.get(membership.conversationId);
    if (!conversation || conversation.type !== "direct") continue;

    const otherMemberships = await ctx.db
      .query("conversationMembers")
      .withIndex("by_conversationId_userId", (q) =>
        q.eq("conversationId", membership.conversationId).eq("userId", otherUserId),
      )
      .collect();

    if (otherMemberships.length > 0) {
      result.push({ id: conversation._id, updatedAt: conversation.updatedAt });
    }
  }

  result.sort((a, b) => b.updatedAt - a.updatedAt);
  return result;
}

async function ensureMembership(
  ctx: MutationCtx,
  conversationId: Id<"conversations">,
  userId: Id<"users">,
  role: "owner" | "member",
  joinedAt: number,
  lastReadAt: number,
) {
  const existing = await ctx.db
    .query("conversationMembers")
    .withIndex("by_conversationId_userId", (q) =>
      q.eq("conversationId", conversationId).eq("userId", userId),
    )
    .collect();

  if (existing.length > 0) {
    await ctx.db.patch(existing[0]._id, {
      role,
      lastReadAt,
    });

    for (const duplicate of existing.slice(1)) {
      await ctx.db.delete(duplicate._id);
    }

    return;
  }

  await ctx.db.insert("conversationMembers", {
    conversationId,
    userId,
    role,
    joinedAt,
    lastReadAt,
  });
}

async function deleteConversationCascade(
  ctx: MutationCtx,
  conversationId: Id<"conversations">,
) {
  const messages = await ctx.db
    .query("messages")
    .withIndex("by_conversationId_createdAt", (q) => q.eq("conversationId", conversationId))
    .collect();

  for (const message of messages) {
    await ctx.db.delete(message._id);
  }

  const memberships = await ctx.db
    .query("conversationMembers")
    .withIndex("by_conversationId", (q) => q.eq("conversationId", conversationId))
    .collect();

  for (const membership of memberships) {
    await ctx.db.delete(membership._id);
  }

  await ctx.db.delete(conversationId);
}

async function replaceConversationMessages(
  ctx: MutationCtx,
  conversationId: Id<"conversations">,
  currentUserId: Id<"users">,
  contactUserId: Id<"users">,
  script: DemoScriptLine[],
  title: string,
) {
  const existingMessages = await ctx.db
    .query("messages")
    .withIndex("by_conversationId_createdAt", (q) => q.eq("conversationId", conversationId))
    .collect();

  for (const message of existingMessages) {
    await ctx.db.delete(message._id);
  }

  const now = Date.now();
  let timestamp = now - script.length * 70_000;

  for (const line of script) {
    timestamp += line.gapMs ?? 70_000;

    const senderUserId =
      line.speaker === "self"
        ? currentUserId
        : line.speaker === "contact"
          ? contactUserId
          : undefined;

    await ctx.db.insert("messages", {
      conversationId,
      senderUserId,
      senderType: line.speaker === "assistant" ? "assistant" : "user",
      content: line.content,
      contentType: "text",
      createdAt: timestamp,
    });
  }

  const lastContent = script[script.length - 1]?.content ?? "Start chatting";

  await ctx.db.patch(conversationId, {
    type: "direct",
    title,
    createdByUserId: currentUserId,
    lastMessagePreview: lastContent.slice(0, 120),
    lastMessageAt: timestamp,
    updatedAt: timestamp,
  });

  await ensureMembership(ctx, conversationId, currentUserId, "owner", now, timestamp);
  await ensureMembership(ctx, conversationId, contactUserId, "member", now, timestamp - 30_000);
}

async function ensureDemoConversationForContact(
  ctx: MutationCtx,
  userId: Id<"users">,
  contact: DemoContact,
) {
  // Special handling for Joe's phone number (18106289189)
  // If the user exists as a real user, create conversation with the real user
  // Otherwise, create a demo user
  let contactUserId: Id<"users">;

  const existingUser = await ctx.db
    .query("users")
    .withIndex("by_phone", (q) => q.eq("phone", contact.phone))
    .unique();

  if (existingUser) {
    // User exists, use the real user
    contactUserId = existingUser._id;
    // Ensure profile exists for real user
    await ensureProfile(ctx, existingUser._id, contact.nickname, contact.city);
  } else {
    // User doesn't exist, create demo user
    contactUserId = await getOrCreateDemoUser(
      ctx,
      contact.phone,
      contact.nickname,
      contact.city,
    );
  }

  const directConversations = await getDirectConversationsBetweenUsers(
    ctx,
    userId,
    contactUserId,
  );
  // Safety-first: if any direct conversation already exists, keep user data untouched.
  // Do not delete duplicates and do not overwrite existing messages.
  if (directConversations.length > 0) {
    return;
  }

  const now = Date.now();
  const conversationId = await ctx.db.insert("conversations", {
    type: "direct",
    title: contact.nickname,
    createdByUserId: userId,
    lastMessagePreview: "",
    lastMessageAt: now,
    createdAt: now,
    updatedAt: now,
  });

  // Only seed static script for demo users created by system.
  // For real users, create empty direct conversation and keep it clean.
  if (!existingUser) {
    await replaceConversationMessages(
      ctx,
      conversationId,
      userId,
      contactUserId,
      contact.script,
      contact.nickname,
    );
  } else {
    await ensureMembership(ctx, conversationId, userId, "owner", now, now);
    await ensureMembership(ctx, conversationId, contactUserId, "member", now, now);
  }
}

async function ensureDemoConversationsForUser(
  ctx: MutationCtx,
  userId: Id<"users">,
) {
  for (const phone of LEGACY_DEMO_PHONES) {
    const legacyDemoUser = await ctx.db
      .query("users")
      .withIndex("by_phone", (q) => q.eq("phone", phone))
      .unique();
    if (!legacyDemoUser) continue;

    const legacyDirectConversations = await getDirectConversationsBetweenUsers(
      ctx,
      userId,
      legacyDemoUser._id,
    );

    for (const legacyConversation of legacyDirectConversations) {
      await deleteConversationCascade(ctx, legacyConversation.id);
    }
  }

  for (const contact of DEMO_CONTACTS) {
    await ensureDemoConversationForContact(ctx, userId, contact);
  }
}

async function ensureInviterDirectConversationForNewUser(
  ctx: MutationCtx,
  newUserId: Id<"users">,
  inviterUserId: Id<"users">,
) {
  if (String(newUserId) === String(inviterUserId)) {
    return;
  }

  const directConversations = await getDirectConversationsBetweenUsers(
    ctx,
    newUserId,
    inviterUserId,
  );

  let conversationId: Id<"conversations">;
  const now = Date.now();

  if (directConversations.length === 0) {
    conversationId = await ctx.db.insert("conversations", {
      type: "direct",
      title: "New connection",
      createdByUserId: inviterUserId,
      lastMessagePreview: "Say hi and start your conversation.",
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    conversationId = directConversations[0].id;

    for (const stale of directConversations.slice(1)) {
      await deleteConversationCascade(ctx, stale.id);
    }
  }

  await ensureMembership(ctx, conversationId, inviterUserId, "owner", now, now);
  await ensureMembership(ctx, conversationId, newUserId, "member", now, now);
}

export const registerWithPhone = mutation({
  args: {
    phone: v.string(),
    password: v.string(),
    confirmPassword: v.string(),
    inviteCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const phone = normalizePhone(args.phone);
      if (!isValidPhone(phone)) {
        throwAuthError("Invalid phone number");
      }
      if (!args.password || args.password.length < 6) {
        throwAuthError("Password must be at least 6 characters");
      }
      if (args.password !== args.confirmPassword) {
        throwAuthError("Passwords do not match");
      }
      const inviteCode = args.inviteCode?.trim().toUpperCase();
      if (!inviteCode) {
        throwAuthError("Invitation code is required");
      }

      const existingUser = await ctx.db
        .query("users")
        .withIndex("by_phone", (q) => q.eq("phone", phone))
        .unique();
      if (existingUser) {
        throwAuthError("Phone number already registered");
      }

      const invitation = await ctx.db
        .query("invitationCodes")
        .withIndex("by_code", (q) => q.eq("code", inviteCode))
        .unique();
      if (!invitation) {
        throwAuthError("Invitation code does not exist");
      }
      if (invitation.usedAt) {
        throwAuthError("Invitation code has been used");
      }

      const now = Date.now();
      const passwordSalt = createSessionToken();
      const passwordHash = await hashPassword(args.password, passwordSalt);

      const userId = await ctx.db.insert("users", {
        phone,
        passwordHash,
        passwordSalt,
        status: "active",
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now,
      });

      const sessionToken = createSessionToken();
      const tokenHash = await sha256Hex(sessionToken);

      await ctx.db.insert("authSessions", {
        userId,
        tokenHash,
        expiresAt: buildSessionExpiresAt(now),
        createdAt: now,
      });

      await ctx.db.patch(invitation._id, {
        usedByUserId: userId,
        usedAt: now,
      });

      await ensureInviterDirectConversationForNewUser(
        ctx,
        userId,
        invitation.createdByUserId,
      );

      // Temporarily disabled to allow registration
      // await ensureDemoConversationsForUser(ctx, userId);

      return {
        sessionToken,
        hasProfile: false,
      };
    } catch (error) {
      console.error("Error in registerWithPhone:", error);
      if (error instanceof ConvexError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new ConvexError(`Internal auth error: ${message}`);
    }
  },
});

export const loginWithPhone = mutation({
  args: {
    phone: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      console.log("loginWithPhone started", { phone: args.phone });

      const phone = normalizePhone(args.phone);
      console.log("Phone normalized", { phone });

      if (!isValidPhone(phone)) {
        throwAuthError("Invalid phone number");
      }

      console.log("Querying user...");
      const user = await ctx.db
        .query("users")
        .withIndex("by_phone", (q) => q.eq("phone", phone))
        .unique();

      console.log("User query result", { found: !!user });

      if (!user) {
        throwAuthError("Phone number is not registered. Please register first.");
      }
      if (user.status !== "active") {
        throwAuthError("Account is disabled");
      }

      console.log("Hashing password...");
      const expectedHash = await hashPassword(args.password, user.passwordSalt);
      console.log("Password hashed");

      if (expectedHash !== user.passwordHash) {
        throwAuthError("Incorrect password");
      }

      console.log("Updating user...");
      const now = Date.now();
      await ctx.db.patch(user._id, {
        lastLoginAt: now,
        updatedAt: now,
      });

      console.log("Creating session token...");
      const sessionToken = createSessionToken();
      const tokenHash = await sha256Hex(sessionToken);

      console.log("Inserting auth session...");
      await ctx.db.insert("authSessions", {
        userId: user._id,
        tokenHash,
        expiresAt: buildSessionExpiresAt(now),
        createdAt: now,
      });

      console.log("Querying profile...");
      const profile = await ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();

      console.log("Login successful", { hasProfile: !!profile });
      return {
        sessionToken,
        hasProfile: !!profile,
      };
    } catch (error) {
      console.error("Error in loginWithPhone:", error);
      console.error("Error stack:", error instanceof Error ? error.stack : "No stack");
      if (error instanceof ConvexError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new ConvexError(`Internal auth error: ${message}`);
    }
  },
});

export const syncDemoConversations = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserBySession(ctx, args.sessionToken);
    await ensureDemoConversationsForUser(ctx, user._id);
    return { success: true };
  },
});

export const logout = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const tokenHash = await sha256Hex(args.sessionToken);
    const session = await ctx.db
      .query("authSessions")
      .withIndex("by_tokenHash", (q) => q.eq("tokenHash", tokenHash))
      .unique();

    if (!session || session.revokedAt) {
      return { success: true };
    }

    await ctx.db.patch(session._id, {
      revokedAt: Date.now(),
    });

    return { success: true };
  },
});

export const me = query({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { user } = await requireUserBySession(ctx, args.sessionToken);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    return {
      id: user._id,
      phone: user.phone,
      hasProfile: !!profile,
      profile: profile
        ? {
            ...profile,
            avatarUrl: await resolveAvatarUrl(ctx, profile),
          }
        : null,
    };
  },
});

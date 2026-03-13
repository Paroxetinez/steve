import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    phone: v.string(),
    passwordHash: v.string(),
    passwordSalt: v.string(),
    status: v.union(v.literal("active"), v.literal("disabled")),
    createdAt: v.number(),
    updatedAt: v.number(),
    lastLoginAt: v.optional(v.number()),
  }).index("by_phone", ["phone"]),

  authSessions: defineTable({
    userId: v.id("users"),
    tokenHash: v.string(),
    expiresAt: v.number(),
    revokedAt: v.optional(v.number()),
    deviceInfo: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_tokenHash", ["tokenHash"])
    .index("by_userId", ["userId"]),

  profiles: defineTable({
    userId: v.id("users"),
    nickname: v.string(),
    gender: v.string(),
    birthday: v.string(),
    city: v.string(),
    avatarObjectKey: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    updatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  conversations: defineTable({
    type: v.union(v.literal("direct"), v.literal("group"), v.literal("assistant")),
    title: v.optional(v.string()),
    createdByUserId: v.id("users"),
    lastMessagePreview: v.optional(v.string()),
    lastMessageAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_updatedAt", ["updatedAt"])
    .index("by_createdByUserId", ["createdByUserId"]),

  conversationMembers: defineTable({
    conversationId: v.id("conversations"),
    userId: v.id("users"),
    role: v.union(v.literal("owner"), v.literal("member"), v.literal("assistant")),
    joinedAt: v.number(),
    lastReadAt: v.optional(v.number()),
    lastReadMessageId: v.optional(v.id("messages")),
  })
    .index("by_userId", ["userId"])
    .index("by_conversationId", ["conversationId"])
    .index("by_conversationId_userId", ["conversationId", "userId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderUserId: v.optional(v.id("users")),
    senderType: v.union(v.literal("user"), v.literal("assistant"), v.literal("system")),
    content: v.string(),
    contentType: v.union(v.literal("text"), v.literal("image")),
    imageObjectKey: v.optional(v.string()),
    pendingImageObjectKey: v.optional(v.string()),
    imageUploadStatus: v.optional(
      v.union(v.literal("uploading"), v.literal("ready"), v.literal("failed")),
    ),
    imageUploadError: v.optional(v.string()),
    imageMimeType: v.optional(v.string()),
    imageSizeBytes: v.optional(v.number()),
    imageWidth: v.optional(v.number()),
    imageHeight: v.optional(v.number()),
    imageStorageId: v.optional(v.id("_storage")),
    clientMessageId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_conversationId_createdAt", ["conversationId", "createdAt"])
    .index("by_clientMessageId", ["clientMessageId"]),

  invitationCodes: defineTable({
    code: v.string(),
    createdByUserId: v.id("users"),
    usedByUserId: v.optional(v.id("users")),
    usedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_createdByUserId", ["createdByUserId"]),

  systemPrompts: defineTable({
    key: v.string(),
    content: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  evermemSyncState: defineTable({
    conversationId: v.id("conversations"),
    lastMirroredMessageId: v.optional(v.id("messages")),
    lastMirroredMessageAt: v.optional(v.number()),
    updatedAt: v.number(),
  }).index("by_conversationId", ["conversationId"]),

  relationshipMemoryCache: defineTable({
    cacheKey: v.string(),
    conversationId: v.id("conversations"),
    pairSummary: v.optional(v.string()),
    pairStage: v.optional(v.string()),
    sourceVersion: v.optional(v.string()),
    lastRefreshedAt: v.number(),
  })
    .index("by_cacheKey", ["cacheKey"])
    .index("by_conversationId", ["conversationId"]),
});

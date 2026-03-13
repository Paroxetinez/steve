"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { buildEverMemMessagePayload } from "./evermemContracts";
import { postMemoryMessage } from "./httpClients/evermemClient";

type ConversationType = "direct" | "group" | "assistant";
type SenderType = "user" | "assistant" | "system";

export function shouldSyncConversationToEverMem(input: {
  conversationType: ConversationType;
  senderType: SenderType;
}) {
  return (
    input.conversationType === "direct" &&
    (input.senderType === "user" || input.senderType === "assistant")
  );
}

export function buildEverMemSyncRequest(input: {
  conversationId: string;
  conversationName: string;
  messageId: string;
  senderId: string;
  senderName: string;
  senderType: "user" | "assistant";
  content: string;
  createdAt: number;
  referList?: string[];
}) {
  return {
    messagePayload: buildEverMemMessagePayload({
      conversationId: input.conversationId,
      conversationName: input.conversationName,
      messageId: input.messageId,
      senderId: input.senderId,
      senderName: input.senderName,
      role: input.senderType,
      content: input.content,
      createdAt: input.createdAt,
      referList: input.referList,
    }),
    syncState: {
      lastMirroredMessageId: input.messageId,
      lastMirroredMessageAt: input.createdAt,
    },
  };
}

export const syncMessageToEverMem = internalAction({
  args: {
    conversationId: v.string(),
    conversationName: v.string(),
    messageId: v.string(),
    senderId: v.string(),
    senderName: v.string(),
    senderType: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
    referList: v.optional(v.array(v.string())),
  },
  handler: async (_ctx, args) => {
    const request = buildEverMemSyncRequest(args);
    await postMemoryMessage(request.messagePayload);
    return request.syncState;
  },
});

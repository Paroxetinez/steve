import type { Id } from "./_generated/dataModel";

export const DIRECT_MARKER = "__DIRECT_SUGGESTION__:";
export const DIRECT_CONTEXT_SIZE = 25;
export const DIRECT_REGENERATE_HISTORY_SIZE = 25;

export type DirectTranscriptMessage = {
  senderType: "user" | "assistant" | "system";
  senderUserId?: Id<"users">;
  content: string;
};

export type DirectPayload = {
  latestMessage: string;
  transcript: string;
  forceSuggestion?: boolean;
  currentSuggestion?: string;
  traceId?: string;
  pipelineStartAt?: number;
  triggerType?: string;
  anchorMessageId?: Id<"messages">;
  anchorCreatedAt?: number;
};

export function buildDirectTranscript(messages: DirectTranscriptMessage[]) {
  const userIdMap = new Map<string, string>();
  let userCounter = 1;

  return messages
    .flatMap((message) => {
      if (message.senderType === "system") {
        return [];
      }
      if (message.senderType === "assistant") {
        const assistantContent = message.content.trim();
        return [/^Steve:\s*/i.test(assistantContent) ? assistantContent : `Steve: ${assistantContent}`];
      }

      const senderKey = message.senderUserId ? String(message.senderUserId) : "unknown";
      if (!userIdMap.has(senderKey)) {
        userIdMap.set(senderKey, `User${userCounter}`);
        userCounter += 1;
      }

      return [`${userIdMap.get(senderKey)}: ${message.content}`];
    })
    .join("\n");
}

export function serializeDirectPayload(payload: DirectPayload) {
  return `${DIRECT_MARKER}${JSON.stringify(payload)}`;
}

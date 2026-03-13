import type { Doc, Id } from "./_generated/dataModel";

export function findLatestReadableMessageId(
  messages: Array<Pick<Doc<"messages">, "_id" | "senderType">>,
): Id<"messages"> | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.senderType !== "system") {
      return message._id;
    }
  }

  return undefined;
}

export function buildReadStatePatch(input: {
  lastReadAt: number;
  lastReadMessageId?: Id<"messages">;
}) {
  return {
    lastReadAt: input.lastReadAt,
    lastReadMessageId: input.lastReadMessageId,
  };
}

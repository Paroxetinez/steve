type EverMemRole = "user" | "assistant";

type BuildEverMemMessagePayloadArgs = {
  conversationId: string;
  conversationName: string;
  messageId: string;
  senderId: string;
  senderName: string;
  role: EverMemRole;
  content: string;
  createdAt: number;
  referList?: string[];
};

export function buildEverMemGroupId(conversationId: string) {
  return `steve:direct:${conversationId}`;
}

export function buildPairMemoryCacheKey(conversationId: string) {
  return `pair:${conversationId}`;
}

export function buildUserMemoryCacheKey(userId: string) {
  return `user:${userId}`;
}

export function buildEverMemMessagePayload({
  conversationId,
  conversationName,
  messageId,
  senderId,
  senderName,
  role,
  content,
  createdAt,
  referList = [],
}: BuildEverMemMessagePayloadArgs) {
  return {
    message_id: messageId,
    create_time: new Date(createdAt).toISOString(),
    sender: senderId,
    sender_name: senderName,
    role,
    content,
    group_id: buildEverMemGroupId(conversationId),
    group_name: conversationName,
    refer_list: referList,
  };
}

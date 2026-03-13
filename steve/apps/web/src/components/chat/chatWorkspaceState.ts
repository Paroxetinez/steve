type ConversationRef = {
  id: string;
};

type ResolveChatWorkspaceStateArgs = {
  conversations: ConversationRef[];
  requestedConversationId: string | null;
  activeConversationId: string | null;
};

export function resolveChatWorkspaceState({
  conversations,
  requestedConversationId,
  activeConversationId,
}: ResolveChatWorkspaceStateArgs) {
  if (conversations.length === 0) {
    return {
      nextActiveConversationId: null,
      shouldRedirectToInbox: true,
    };
  }

  if (requestedConversationId) {
    const requestedConversation = conversations.find(
      (conversation) => conversation.id === requestedConversationId,
    );
    if (requestedConversation) {
      return {
        nextActiveConversationId: requestedConversation.id,
        shouldRedirectToInbox: false,
      };
    }
  }

  if (
    activeConversationId &&
    conversations.some((conversation) => conversation.id === activeConversationId)
  ) {
    return {
      nextActiveConversationId: activeConversationId,
      shouldRedirectToInbox: false,
    };
  }

  return {
    nextActiveConversationId: conversations[0]?.id ?? null,
    shouldRedirectToInbox: false,
  };
}

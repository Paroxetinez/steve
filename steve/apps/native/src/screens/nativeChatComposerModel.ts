export function canSendNativeChatDraft(input: {
  conversationId: string | null;
  draft: string;
  sending: boolean;
  sessionToken: string | null;
}) {
  return Boolean(
    input.conversationId &&
      input.sessionToken &&
      !input.sending &&
      input.draft.trim().length > 0,
  );
}

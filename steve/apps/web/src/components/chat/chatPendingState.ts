export function resolveChatPendingState(input: {
  sending: boolean;
  uploadingImage: boolean;
}) {
  const showPending = input.sending || input.uploadingImage;

  return {
    showPending,
    isMine: showPending,
  };
}

export function sumUnreadConversationCounts(counts: number[]) {
  return counts.reduce((sum, count) => sum + count, 0);
}

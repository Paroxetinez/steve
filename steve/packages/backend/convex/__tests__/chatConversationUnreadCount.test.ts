import { sumUnreadConversationCounts } from "../chatConversationUnreadCount";

describe("sumUnreadConversationCounts", () => {
  test("adds unread counts from all conversations", () => {
    expect(sumUnreadConversationCounts([3, 0, 2, 5])).toBe(10);
  });

  test("returns zero when there are no conversations", () => {
    expect(sumUnreadConversationCounts([])).toBe(0);
  });
});

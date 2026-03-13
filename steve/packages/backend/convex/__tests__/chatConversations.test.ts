import { filterDiscoverUsers } from "../chatConversationHelpers";

describe("filterDiscoverUsers", () => {
  test("filters connected users by default", () => {
    expect(
      filterDiscoverUsers([
        { userId: "u1", isConnected: false },
        { userId: "u2", isConnected: true },
      ]),
    ).toEqual([{ userId: "u1", isConnected: false }]);
  });

  test("includes connected users when explicitly requested", () => {
    expect(
      filterDiscoverUsers(
        [
          { userId: "u1", isConnected: false },
          { userId: "u2", isConnected: true },
        ],
        true,
      ),
    ).toEqual([
      { userId: "u1", isConnected: false },
      { userId: "u2", isConnected: true },
    ]);
  });
});

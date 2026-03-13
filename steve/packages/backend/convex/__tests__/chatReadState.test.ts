import { buildReadStatePatch, findLatestReadableMessageId } from "../chatReadState";

describe("findLatestReadableMessageId", () => {
  test("returns the newest non-system message id", () => {
    expect(
      findLatestReadableMessageId([
        { _id: "m1" as never, senderType: "user" },
        { _id: "m2" as never, senderType: "system" },
        { _id: "m3" as never, senderType: "assistant" },
      ]),
    ).toBe("m3");
  });

  test("returns undefined when there are no readable messages", () => {
    expect(
      findLatestReadableMessageId([{ _id: "m1" as never, senderType: "system" }]),
    ).toBeUndefined();
  });
});

describe("buildReadStatePatch", () => {
  test("stores both the read timestamp and message anchor", () => {
    expect(
      buildReadStatePatch({
        lastReadAt: 123,
        lastReadMessageId: "m3" as never,
      }),
    ).toEqual({
      lastReadAt: 123,
      lastReadMessageId: "m3",
    });
  });
});

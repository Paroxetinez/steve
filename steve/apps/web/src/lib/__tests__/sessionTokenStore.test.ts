import { createSessionTokenStore } from "../sessionTokenStore";

describe("createSessionTokenStore", () => {
  test("reads from storage only once until the cache is refreshed", () => {
    const readToken = jest
      .fn<string | null, []>()
      .mockReturnValueOnce("token-1")
      .mockReturnValueOnce("token-2");

    const store = createSessionTokenStore(readToken);

    expect(store.get()).toBe("token-1");
    expect(store.get()).toBe("token-1");
    expect(readToken).toHaveBeenCalledTimes(1);

    expect(store.refresh()).toBe("token-2");
    expect(readToken).toHaveBeenCalledTimes(2);
  });

  test("allows writes and clears without re-reading storage", () => {
    const readToken = jest.fn<string | null, []>().mockReturnValue("token-1");
    const store = createSessionTokenStore(readToken);

    expect(store.get()).toBe("token-1");
    store.set("token-2");
    expect(store.get()).toBe("token-2");

    store.clear();
    expect(store.get()).toBeNull();
    expect(readToken).toHaveBeenCalledTimes(1);
  });
});

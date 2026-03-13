export function createSessionTokenStore(readToken: () => string | null) {
  let cachedToken: string | null | undefined;

  function get() {
    if (cachedToken !== undefined) {
      return cachedToken;
    }

    cachedToken = readToken();
    return cachedToken;
  }

  function refresh() {
    cachedToken = readToken();
    return cachedToken;
  }

  function set(token: string | null) {
    cachedToken = token;
  }

  function clear() {
    cachedToken = null;
  }

  return {
    get,
    refresh,
    set,
    clear,
  };
}
